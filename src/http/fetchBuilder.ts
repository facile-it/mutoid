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

const isEndpointCacheable = (endpoint: EndpointRequest) => typeof getEndpointAppCacheTtl(endpoint) !== 'undefined'

// -------------------------------------------------------------------------------------
// Deps
// -------------------------------------------------------------------------------------

export type FetchDeps = DepsAjax

export type FetchDepsCacheable = FetchDeps & DepsCache

export interface DepsAjax {
    ajax: typeof ajax
}

export interface DepsCache {
    cache: CacheService
}

// -------------------------------------------------------------------------------------
// ResourceBad
// -------------------------------------------------------------------------------------

export interface ResourceBadRejected {
    type: 'rejected'
    error: 'notFound' | 'clientError'
    errorMessage: string
    statusCode: number
    detail: unknown
}

export interface ResourceBadFail {
    type: 'fail'
    error: 'fail' | 'unexpectedResponse' | 'unknownError' | 'networkError' | 'decodeError'
    errorMessage: string
    statusCode: number
    detail: unknown
}

type ResourceBad = ResourceBadRejected | ResourceBadFail

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

// -------------------------------------------------------------------------------------
// Builder
// -------------------------------------------------------------------------------------

export const fetchBuilder = <DL, OL>(loggerFail: (e: ResourceBad) => R.Reader<DL, OL>) => <
    K extends StatusCode,
    DS extends {
        [k in K]?: (i: unknown) => E.Either<t.Errors, any>
    },
    SC extends keyof DS
>(
    doRequest: () => EndpointRequest,
    decoder: Lazy<DS>,
    successCodes: Array<SC>
) => {
    const endpoint = doRequest()
    return pipe(
        (deps: FetchDeps) => runRequest(deps, endpoint, decoder),
        RORFilterRequest(successCodes, endpoint),
        logFail(loggerFail)
    )
}

export const fetchBuilderCacheable = <DL, OL>(
    createCacheKey: CreateCacheKey,
    loggerFail: (e: ResourceBad) => R.Reader<DL, OL>
) => <
    K extends StatusCode,
    DS extends {
        [k in K]?: (i: unknown) => E.Either<t.Errors, any>
    },
    SC extends keyof DS
>(
    doRequest: () => EndpointRequest,
    decoder: Lazy<DS>,
    successCodes: Array<SC>
) => {
    const endpoint = doRequest()

    if (!isEndpointCacheable(endpoint)) {
        return fetchBuilder(loggerFail)(doRequest, decoder, successCodes)
    }

    return pipe((deps: FetchDepsCacheable) => {
        return pipe(
            deps.cache.getItem(createCacheKey(endpoint)),
            OR.fromTask,
            OR.chain(item => {
                return pipe(
                    item,
                    O.bindTo('item'),
                    O.bind('ttl', () => O.fromNullable(getEndpointAppCacheTtl(endpoint))),
                    O.bind('decoder', i => O.fromNullable(decoder()[i.item.status as SC])),
                    O.map(ci => {
                        return pipe(
                            ci.decoder(ci.item.data),
                            E.bimap(
                                (e): ResourceBad => ({
                                    type: 'fail',
                                    error: 'decodeError',
                                    errorMessage: `[fetchBuilder] decodeError ${endpoint.url}`,
                                    statusCode: ci.item.status as number,
                                    detail: PathReporter.report(t.failures(e)).join('\n>> '),
                                }),
                                (d): RES.DecodersToResourceData<DS> => ({
                                    status: ci.item.status as SC,
                                    payload: d,
                                })
                            ),
                            OR.fromEither,
                            c => c,
                            ORFilterRequest(successCodes, endpoint)
                        )
                    }),
                    O.getOrElse(() =>
                        pipe(
                            runRequest(deps, endpoint, decoder),
                            OR.chainFirstW(e => {
                                const ttl = getEndpointAppCacheTtl(endpoint)
                                return ttl
                                    ? pipe(
                                          deps.cache.setItem(
                                              createCacheKey(endpoint),
                                              e.status as StatusCode,
                                              e.payload,
                                              ttl
                                          ),
                                          OR.rightIO
                                      )
                                    : OR.done<never, unknown>(e)
                            }),
                            ORFilterRequest(successCodes, endpoint)
                        )
                    )
                )
            })
        )
    }, logFail(loggerFail))
}

const runRequest = <
    K extends StatusCode,
    DS extends {
        [k in K]?: (i: unknown) => E.Either<t.Errors, any>
    }
>(
    deps: FetchDeps,
    endpoint: EndpointRequest,
    decoder: Lazy<DS>
) =>
    pipe(
        OR.fromAjax(deps.ajax(endpoint), decoder()),
        OR.mapLeft(
            (e): ResourceBad => {
                switch (e.type) {
                    case 'unexpectedResponse':
                        return {
                            type: 'fail',
                            statusCode: e.detail.status as StatusCode,
                            error: e.type,
                            errorMessage: `[fetchBuilder] ${e.type} ${endpoint.url}`,
                            detail: e.detail,
                        }
                    case 'unknownError':
                    case 'networkError':
                        return {
                            type: 'fail',
                            statusCode: 0,
                            error: e.type,
                            errorMessage: `[fetchBuilder] ${e.type} ${endpoint.url}`,
                            detail: e.detail,
                        }
                    case 'decodeError':
                        return {
                            type: 'fail',
                            error: e.type,
                            errorMessage: `[fetchBuilder] ${e.type} ${endpoint.url}`,
                            statusCode: e.statusCode,
                            detail: PathReporter.report(t.failures(e.detail)).join('\n>> '),
                        }
                }
            }
        )
    )

const filterPredicate = <
    K extends StatusCode,
    DS extends {
        [k in K]?: (i: unknown) => E.Either<t.Errors, any>
    },
    SC extends keyof DS
>(
    successCodes: Array<SC>
) => (r: RES.DecodersToResourceData<DS>): r is Extract<typeof r, { status: SC }> =>
    successCodes.includes(r.status as SC)

const filterOnFalse = <
    K extends StatusCode,
    DS extends {
        [k in K]?: (i: unknown) => E.Either<t.Errors, any>
    }
>(
    endpoint: EndpointRequest
) => (r: RES.DecodersToResourceData<DS>): ResourceBad => {
    if (r.status === 404) {
        return {
            type: 'rejected',
            error: 'notFound',
            errorMessage: `[fetchBuilder] notFound ${endpoint.url}`,
            statusCode: r.status as StatusCode,
            detail: r.payload,
        }
    }

    if (r.status >= 400 && r.status <= 499) {
        return {
            type: 'rejected',
            error: 'clientError',
            errorMessage: `[fetchBuilder] clientError ${endpoint.url}`,
            statusCode: r.status as StatusCode,
            detail: r.payload,
        }
    }

    return {
        type: 'fail',
        error: 'fail',
        errorMessage: `[fetchBuilder] fail ${endpoint.url}`,
        statusCode: r.status as StatusCode,
        detail: r.payload,
    }
}

const RORFilterRequest = <
    K extends StatusCode,
    DS extends {
        [k in K]?: (i: unknown) => E.Either<t.Errors, any>
    },
    SC extends keyof DS
>(
    successCodes: Array<SC>,
    endpoint: EndpointRequest
) => ROR.filterOrElseW(filterPredicate<K, DS, SC>(successCodes), filterOnFalse(endpoint))

const ORFilterRequest = <
    K extends StatusCode,
    DS extends {
        [k in K]?: (i: unknown) => E.Either<t.Errors, any>
    },
    SC extends keyof DS
>(
    successCodes: Array<SC>,
    endpoint: EndpointRequest
) => OR.filterOrElseW(filterPredicate<K, DS, SC>(successCodes), filterOnFalse(endpoint))

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
