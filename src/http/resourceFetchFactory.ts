import * as E from 'fp-ts/Either'
import type * as IO from 'fp-ts/IO'
import * as O from 'fp-ts/Option'
import type * as R from 'fp-ts/Reader'
import * as T from 'fp-ts/Task'
import type * as TO from 'fp-ts/TaskOption'
import { Lazy, pipe } from 'fp-ts/function'
import * as t from 'io-ts'
import { PathReporter } from 'io-ts/PathReporter'
import type { ajax, AjaxConfig } from 'rxjs/ajax'
import * as OR from './ObservableResource'
import * as ROR from './ReaderObservableResource'
import type * as RES from './Resource'
import type { resourceBadFailT, resourceBadRejectedT, resourceBadT } from './io-types/resourceBadT'
import type { StatusCode } from './statusCode'

// -------------------------------------------------------------------------------------
// Cache
// -------------------------------------------------------------------------------------

export type CacheItem<S = StatusCode, P = unknown> = RES.ResourceData<S, P>

export type CachePool = CachePoolSync | CachePoolAsync

export interface CachePoolSync {
    _tag: 'sync'
    findItem: (key: string) => IO.IO<O.Option<CacheItem>>
    addItem: (key: string, item: CacheItem, ttl: number) => IO.IO<void>
}

export interface CachePoolAsync {
    _tag: 'async'
    findItem: (key: string) => TO.TaskOption<CacheItem>
    addItem: (key: string, item: CacheItem, ttl: number) => T.Task<void>
}

export interface LoggerFail<DL, OL> {
    (e: ResourceBad): R.Reader<DL, OL>
}

export interface CreateCacheKey<DC> {
    (endpoint: EndpointRequest): R.Reader<DC, string>
}

const getEndpointAppCacheTtl = (endpoint: EndpointRequestCacheable) =>
    endpoint.method === 'GET' && typeof endpoint.appCacheTtl !== 'undefined' && endpoint.appCacheTtl > 0
        ? endpoint.appCacheTtl
        : undefined

// -------------------------------------------------------------------------------------
// Deps
// -------------------------------------------------------------------------------------

export type FetchFactoryDeps = DepsAjax

export type FetchFactoryCacheableDeps = FetchFactoryDeps & DepsCache

export interface DepsAjax {
    ajax: typeof ajax
}

export interface DepsCache {
    cachePool: CachePool
}

// -------------------------------------------------------------------------------------
// ResourceBad
// -------------------------------------------------------------------------------------

interface ResourceBadCtor<RB extends ResourceBadRejected | ResourceBadFail> {
    error: RB['error']
    detail: unknown
    errorMessage?: string
    statusCode?: StatusCode | 0
}

export type ResourceBadRejected = t.TypeOf<typeof resourceBadRejectedT>
export const resourceBadRejected = (d: ResourceBadCtor<ResourceBadRejected>): ResourceBad => ({
    type: 'rejected',
    error: d.error,
    detail: d.detail,
    statusCode: d.statusCode ?? 0,
    errorMessage: d.errorMessage ?? d.error,
})

export type ResourceBadFail = t.TypeOf<typeof resourceBadFailT>
export const resourceBadFail = (d: ResourceBadCtor<ResourceBadFail>): ResourceBad => ({
    type: 'fail',
    error: d.error,
    detail: d.detail,
    statusCode: d.statusCode ?? 0,
    errorMessage: d.errorMessage ?? d.error,
})

export type ResourceBad = t.TypeOf<typeof resourceBadT>

// -------------------------------------------------------------------------------------
// Request
// -------------------------------------------------------------------------------------

interface EndpointRequestAjaxRequest extends AjaxConfig {
    url: string
    headers?: Record<string, string>
}

interface EndpointRequestMethod {
    method: 'HEAD' | 'PUT' | 'POST' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'CONNECT'
}

export type EndpointRequest = EndpointRequestAjaxRequest &
    (
        | {
              method: 'GET'
          }
        | EndpointRequestMethod
    )

export type EndpointRequestCacheable = EndpointRequestAjaxRequest &
    (
        | {
              method: 'GET'
              appCacheTtl?: number
          }
        | EndpointRequestMethod
    )

export type FetchFactoryDecoders<K extends StatusCode> = {
    [k in K]?: (i: unknown) => E.Either<t.Errors, any>
}

// -------------------------------------------------------------------------------------
// Factory
// -------------------------------------------------------------------------------------

const errorMessagePrefix = '[fetchFactory]'

export const fetchFactory =
    <DL, OL>(env: { loggerFail: (e: ResourceBad) => R.Reader<DL, OL> }) =>
    <K extends StatusCode, DS extends FetchFactoryDecoders<K>, SC extends keyof DS>(
        request: EndpointRequest,
        decoderL: Lazy<DS>,
        successCodes: Array<SC>
    ) => {
        return pipe(
            (deps: FetchFactoryDeps) => runRequest(deps, request, decoderL),
            ROR_filterResponse(successCodes, request),
            logFail(env.loggerFail)
        )
    }

export const fetchCacheableFactory =
    <DL, OL, DC>(env: { loggerFail: LoggerFail<DL, OL>; createCacheKey: CreateCacheKey<DC> }) =>
    <K extends StatusCode, DS extends FetchFactoryDecoders<K>, SC extends keyof DS>(
        request: EndpointRequestCacheable,
        decoderL: Lazy<DS>,
        successCodes: Array<SC>
    ) => {
        const appCacheTtl = getEndpointAppCacheTtl(request)

        if (typeof appCacheTtl === 'undefined') {
            return fetchFactory(env)(request, decoderL, successCodes)
        }

        return pipe(
            env.createCacheKey(request),
            ROR.fromReader,
            ROR.chainW(cacheKey => (deps: FetchFactoryCacheableDeps) => {
                return pipe(
                    deps.cachePool._tag === 'sync'
                        ? T.fromIO(deps.cachePool.findItem(cacheKey))
                        : deps.cachePool.findItem(cacheKey),
                    OR.fromTask,
                    OR.chain(item => {
                        return pipe(
                            item,
                            O.bindTo('item'),
                            O.bind('decoder', x => O.fromNullable(decoderL()[x.item.status as SC])),
                            O.bind('payload', x =>
                                pipe(
                                    x.decoder(x.item.payload),
                                    // when decode fail don't delete item, but run new request and overwrite it
                                    E.fold(() => O.none, O.some)
                                )
                            ),
                            O.map(x =>
                                pipe(
                                    x.payload,
                                    (payload): RES.DecodersToResourceData<DS> => ({
                                        status: x.item.status as SC,
                                        payload,
                                    }),
                                    OR.done,
                                    OR_filterResponse(successCodes, request)
                                )
                            ),
                            O.getOrElse(() =>
                                pipe(
                                    runRequest(deps, request, decoderL),
                                    OR.chainFirstW(r =>
                                        pipe(
                                            deps.cachePool._tag === 'sync'
                                                ? T.fromIO(
                                                      deps.cachePool.addItem(cacheKey, r as CacheItem, appCacheTtl)
                                                  )
                                                : deps.cachePool.addItem(cacheKey, r as CacheItem, appCacheTtl),
                                            OR.doneTask
                                        )
                                    ),
                                    OR_filterResponse(successCodes, request)
                                )
                            )
                        )
                    })
                )
            }),
            logFail(env.loggerFail)
        )
    }

const runRequest = <K extends StatusCode, DS extends FetchFactoryDecoders<K>>(
    deps: FetchFactoryDeps,
    request: EndpointRequest,
    decoder: Lazy<DS>
) =>
    pipe(
        OR.fromAjax(deps.ajax(request), decoder()),
        OR.mapLeft((e): ResourceBad => {
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
        })
    )

const filterPredicate =
    <K extends StatusCode, DS extends FetchFactoryDecoders<K>, SC extends keyof DS>(successCodes: Array<SC>) =>
    (r: RES.DecodersToResourceData<DS>): r is Extract<typeof r, { status: SC }> =>
        successCodes.includes(r.status as SC)

const filterOnFalse =
    <
        K extends StatusCode,
        DS extends {
            [k in K]?: (i: unknown) => E.Either<t.Errors, any>
        }
    >(
        request: EndpointRequest
    ) =>
    (r: RES.DecodersToResourceData<DS>): ResourceBad => {
        if (r.status === 404) {
            return {
                type: 'rejected',
                error: 'notFound',
                errorMessage: errorMessage(request, 'notFound'),
                statusCode: r.status as StatusCode,
                detail: r.payload,
            }
        }

        if ((r.status as StatusCode) >= 400 && (r.status as StatusCode) <= 499) {
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

export const logFail =
    <R1, B>(loggerFail: (e: ResourceBad) => R.Reader<R1, B>) =>
    <R2, A>(
        ma: ROR.ReaderObservableResource<R2, ResourceBad, A>
    ): ROR.ReaderObservableResource<R2 & R1, ResourceBad, A> => {
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
