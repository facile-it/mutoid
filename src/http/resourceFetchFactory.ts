import * as E from 'fp-ts/Either'
import type * as IO from 'fp-ts/IO'
import * as O from 'fp-ts/Option'
import type * as R from 'fp-ts/Reader'
import type * as TO from 'fp-ts/TaskOption'
import { Lazy, pipe } from 'fp-ts/function'
import * as t from 'io-ts'
import { PathReporter } from 'io-ts/PathReporter'
import type { ajax, AjaxRequest } from 'rxjs/ajax'
import * as OR from './ObservableResource'
import * as ROR from './ReaderObservableResource'
import type * as RES from './Resource'
import type { StatusCode } from './statusCode'

// -------------------------------------------------------------------------------------
// Cache
// -------------------------------------------------------------------------------------

export interface CacheItem<D = unknown> {
    validUntil: number
    status: StatusCode
    data: D
}

export interface CacheService {
    setItem: (key: string, status: StatusCode, data: unknown, ttl?: number) => IO.IO<void>
    deleteItem: (key: string) => IO.IO<void>
    getItem: (key: string) => TO.TaskOption<CacheItem>
}

export interface CreateCacheKey {
    (endpoint: EndpointRequest): string
}

const getEndpointAppCacheTtl = (endpoint: EndpointRequest) =>
    endpoint.method === 'GET' && typeof endpoint.appCacheTtl !== 'undefined' && endpoint.appCacheTtl > 0
        ? endpoint.appCacheTtl
        : undefined

// -------------------------------------------------------------------------------------
// Deps
// -------------------------------------------------------------------------------------

export type FetchFactoryDeps = DepsAjax

export type FetchFactoryDepsCacheable = FetchFactoryDeps & DepsCache

export interface DepsAjax {
    ajax: typeof ajax
}

export interface DepsCache {
    cache: CacheService
}

// -------------------------------------------------------------------------------------
// ResourceBad
// -------------------------------------------------------------------------------------

interface ResourceBadCtor<R extends ResourceBadRejected | ResourceBadFail> {
    error: R['error']
    detail: unknown
    errorMessage?: string
    statusCode?: number
}

export interface ResourceBadRejected {
    type: 'rejected'
    error: 'notFound' | 'clientError'
    errorMessage: string
    statusCode: number
    detail: unknown
}
export const resourceBadRejected = (d: ResourceBadCtor<ResourceBadRejected>): ResourceBad => ({
    type: 'rejected',
    error: d.error,
    detail: d.detail,
    statusCode: d.statusCode ?? 0,
    errorMessage: d.errorMessage ?? d.error,
})

export interface ResourceBadFail {
    type: 'fail'
    error: 'fail' | 'unexpectedResponse' | 'unknownError' | 'networkError' | 'decodeError' | 'appError'
    errorMessage: string
    statusCode: number
    detail: unknown
}
export const resourceBadFail = (d: ResourceBadCtor<ResourceBadFail>): ResourceBad => ({
    type: 'fail',
    error: d.error,
    detail: d.detail,
    statusCode: d.statusCode ?? 0,
    errorMessage: d.errorMessage ?? d.error,
})

export type ResourceBad = ResourceBadRejected | ResourceBadFail

// -------------------------------------------------------------------------------------
// Request
// -------------------------------------------------------------------------------------

interface EndpointRequestAjaxRequest extends AjaxRequest {
    url: string
    headers?: Record<string, string>
}

export type EndpointRequest = EndpointRequestAjaxRequest &
    (
        | {
              method: 'GET'
              appCacheTtl?: number
          }
        | {
              method: 'HEAD' | 'PUT' | 'POST' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'CONNECT'
          }
    )

export type FetchFactoryDecoders<K extends StatusCode> = {
    [k in K]?: (i: unknown) => E.Either<t.Errors, any>
}

// -------------------------------------------------------------------------------------
// Factory
// -------------------------------------------------------------------------------------

const errorMessagePrefix = '[fetchFactory]'

export const fetchFactory = <DL, OL>(loggerFail: (e: ResourceBad) => R.Reader<DL, OL>) => <
    K extends StatusCode,
    DS extends FetchFactoryDecoders<K>,
    SC extends keyof DS
>(
    request: EndpointRequest,
    decoderL: Lazy<DS>,
    successCodes: Array<SC>
) => {
    return pipe(
        (deps: FetchFactoryDeps) => runRequest(deps, request, decoderL),
        ROR_filterResponse(successCodes, request),
        logFail(loggerFail)
    )
}

export const fetchCacheableFactory = <DL, OL>(
    createCacheKey: CreateCacheKey,
    loggerFail: (e: ResourceBad) => R.Reader<DL, OL>
) => <K extends StatusCode, DS extends FetchFactoryDecoders<K>, SC extends keyof DS>(
    request: EndpointRequest,
    decoderL: Lazy<DS>,
    successCodes: Array<SC>
) => {
    const appCacheTtl = getEndpointAppCacheTtl(request)

    if (typeof appCacheTtl === 'undefined') {
        return fetchFactory(loggerFail)(request, decoderL, successCodes)
    }

    return pipe((deps: FetchFactoryDepsCacheable) => {
        return pipe(
            deps.cache.getItem(createCacheKey(request)),
            OR.fromTask,
            OR.chain(item => {
                return pipe(
                    item,
                    O.bindTo('item'),
                    O.bind('ttl', () => O.fromNullable(appCacheTtl)),
                    O.bind('decoder', i => O.fromNullable(decoderL()[i.item.status as SC])),
                    O.map(ci => {
                        return pipe(
                            ci.decoder(ci.item.data),
                            E.bimap(
                                (e): ResourceBad => ({
                                    type: 'fail',
                                    error: 'decodeError',
                                    errorMessage: errorMessage(request, 'decodeError'),
                                    statusCode: ci.item.status as number,
                                    detail: PathReporter.report(t.failures(e)).join('\n>> '),
                                }),
                                (d): RES.DecodersToResourceData<DS> => ({
                                    status: ci.item.status as SC,
                                    payload: d,
                                })
                            ),
                            OR.fromEither,
                            OR_filterResponse(successCodes, request)
                        )
                    }),
                    O.getOrElse(() =>
                        pipe(
                            runRequest(deps, request, decoderL),
                            OR.chainFirstW(e =>
                                pipe(
                                    deps.cache.setItem(
                                        createCacheKey(request),
                                        e.status as StatusCode,
                                        e.payload,
                                        appCacheTtl
                                    ),
                                    OR.rightIO
                                )
                            ),
                            OR_filterResponse(successCodes, request)
                        )
                    )
                )
            })
        )
    }, logFail(loggerFail))
}

const runRequest = <K extends StatusCode, DS extends FetchFactoryDecoders<K>>(
    deps: FetchFactoryDeps,
    request: EndpointRequest,
    decoder: Lazy<DS>
) =>
    pipe(
        OR.fromAjax(deps.ajax(request), decoder()),
        OR.mapLeft(
            (e): ResourceBad => {
                switch (e.type) {
                    case 'networkError':
                    case 'unexpectedResponse':
                        return {
                            type: 'fail',
                            statusCode: e.detail.status as StatusCode,
                            error: e.type,
                            errorMessage: errorMessage(request, e.type),
                            detail: e.detail,
                        }
                    case 'unknownError':
                        return {
                            type: 'fail',
                            statusCode: 0,
                            error: e.type,
                            errorMessage: errorMessage(request, e.type),
                            detail: e.detail,
                        }
                    case 'decodeError':
                        return {
                            type: 'fail',
                            error: e.type,
                            errorMessage: errorMessage(request, e.type),
                            statusCode: e.statusCode,
                            detail: PathReporter.report(t.failures(e.detail)).join('\n>> '),
                        }
                }
            }
        )
    )

const filterPredicate = <K extends StatusCode, DS extends FetchFactoryDecoders<K>, SC extends keyof DS>(
    successCodes: Array<SC>
) => (r: RES.DecodersToResourceData<DS>): r is Extract<typeof r, { status: SC }> =>
    successCodes.includes(r.status as SC)

const filterOnFalse = <
    K extends StatusCode,
    DS extends {
        [k in K]?: (i: unknown) => E.Either<t.Errors, any>
    }
>(
    request: EndpointRequest
) => (r: RES.DecodersToResourceData<DS>): ResourceBad => {
    if (r.status === 404) {
        return {
            type: 'rejected',
            error: 'notFound',
            errorMessage: errorMessage(request, 'notFound'),
            statusCode: r.status as StatusCode,
            detail: r.payload,
        }
    }

    if (r.status >= 400 && r.status <= 499) {
        return {
            type: 'rejected',
            error: 'clientError',
            errorMessage: errorMessage(request, 'clientError'),
            statusCode: r.status as StatusCode,
            detail: r.payload,
        }
    }

    return {
        type: 'fail',
        error: 'fail',
        errorMessage: errorMessage(request, 'fail'),
        statusCode: r.status as StatusCode,
        detail: r.payload,
    }
}

const ROR_filterResponse = <K extends StatusCode, DS extends FetchFactoryDecoders<K>, SC extends keyof DS>(
    successCodes: Array<SC>,
    request: EndpointRequest
) => ROR.filterOrElseW(filterPredicate<K, DS, SC>(successCodes), filterOnFalse(request))

const OR_filterResponse = <
    K extends StatusCode,
    DS extends {
        [k in K]?: (i: unknown) => E.Either<t.Errors, any>
    },
    SC extends keyof DS
>(
    successCodes: Array<SC>,
    request: EndpointRequest
) => OR.filterOrElseW(filterPredicate<K, DS, SC>(successCodes), filterOnFalse(request))

export const errorMessage = (endpoint: EndpointRequest, error: ResourceBad['error']) =>
    `${errorMessagePrefix} ${error} ${endpoint.url}`

export const logFail = <R1, B>(loggerFail: (e: ResourceBad) => R.Reader<R1, B>) => <R, A>(
    ma: ROR.ReaderObservableResource<R, ResourceBad, A>
): ROR.ReaderObservableResource<R & R1, ResourceBad, A> => {
    return pipe(
        ma,
        ROR.orElseW((e: ResourceBad) => {
            return pipe(
                loggerFail(e),
                ROR.fromReader,
                ROR.map(() => e),
                ROR.swap
            )
        })
    )
}
