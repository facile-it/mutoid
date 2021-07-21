import { Lazy, pipe } from 'fp-ts/function'
import { map, take } from 'rxjs/operators'
import * as ROR from '../../src/http/ReaderObservableResource'
import * as RES from '../../src/http/Resource'
import * as DS from '../../src/http/dataSerializer'
import * as RESFF from '../../src/http/resourceFetchFactory'
import type { StatusCode } from '../../src/http/statusCode'
import { hashString } from '../../src/utility/hash'
import type { LoggerDeps } from '../logger'
import { logError } from '../logger'
import type { AccessToken, SessionStore } from '../stores/sessionStore'

// -------------------------------------------------------------------------------------
// Model
// -------------------------------------------------------------------------------------

export type FetchDeps = DepsStore & LoggerDeps & RESFF.FetchFactoryDeps

export interface DepsStore {
    store: SessionStore
}

// -------------------------------------------------------------------------------------
// Constructor
// -------------------------------------------------------------------------------------

export const appEndpointRequest = <E extends Record<string, string | number>>(e?: E) => (
    accessToken: AccessToken
): RESFF.EndpointRequest => ({
    method: 'GET',
    url: `https://ron-swanson-quotes.herokuapp.com/v2/quotes${pipe(
        { token: accessToken, ...e },
        DS.serializeUrl(new URLSearchParams()),
        DS.toQueryString
    )}`,
})

const fetchWithErrorLog = RESFF.fetchFactory(logError)

export const appFetchFactory = <K extends StatusCode, DS extends RESFF.FetchFactoryDecoders<K>, SC extends keyof DS>(
    doRequest: (token: AccessToken) => RESFF.EndpointRequest,
    decoder: Lazy<DS>,
    successCodes: Array<SC>
) =>
    pipe(
        tokenRetriever,
        ROR.mapLeft(e => RESFF.resourceBadFail({ error: e.type, detail: e.detail })),
        ROR.chainW(token => fetchWithErrorLog(doRequest(token), decoder, successCodes))
    )

// -------------------------------------------------------------------------------------
// Constructor cacheable
// -------------------------------------------------------------------------------------

export const appEndpointRequestCacheable = <E extends Record<string, string | number>>(e?: E) => (
    accessToken: AccessToken
): RESFF.EndpointRequestCacheable => ({
    method: 'GET',
    appCacheTtl: 30,
    url: `https://ron-swanson-quotes.herokuapp.com/v2/quotes${pipe(
        { token: accessToken, ...e },
        DS.serializeUrl(new URLSearchParams()),
        DS.toQueryString
    )}`,
})

const fetchCacheableWithErrorLog = RESFF.fetchCacheableFactory(logError, e => hashString(e.url))

export const appFetchCacheable = <K extends StatusCode, DS extends RESFF.FetchFactoryDecoders<K>, SC extends keyof DS>(
    doRequest: (token: AccessToken) => RESFF.EndpointRequest,
    decoder: Lazy<DS>,
    successCodes: Array<SC>
) =>
    pipe(
        tokenRetriever,
        ROR.mapLeft(e => RESFF.resourceBadFail({ error: e.type, detail: e.detail })),
        ROR.chainW(token => fetchCacheableWithErrorLog(doRequest(token), decoder, successCodes))
    )

// -------------------------------------------------------------------------------------
// Utility
// -------------------------------------------------------------------------------------

export type authAppError = string

const tokenRetriever: ROR.ReaderObservableResource<
    DepsStore,
    RES.ResourceAjaxError<authAppError>,
    AccessToken
> = deps => {
    return deps.store.state$.pipe(
        take(1),
        map(ss =>
            ss.status === 'done'
                ? RES.done(ss.accessToken)
                : RES.ajaxFail<authAppError>({
                      type: 'appError',
                      detail: 'apiKey not found',
                  })
        )
    )
}
