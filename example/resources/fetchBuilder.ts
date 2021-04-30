import { flow, Lazy, pipe } from 'fp-ts/function'
import type { ajax, AjaxRequest } from 'rxjs/ajax'
import { map, take } from 'rxjs/operators'
import * as OR from '../../src/http/ObservableResource'
import * as ROR from '../../src/http/ReaderObservableResource'
import * as RES from '../../src/http/Resource'
import type { StatusCode } from '../../src/http/statusCode'
import type { LoggerDeps } from '../logger'
import { logError } from '../logger'
import type { AccessToken, SessionStore } from '../stores/sessionStore'

export type FetchDeps = LoggerDeps & DepsAjax & DepsStore

export interface DepsAjax {
    ajax: typeof ajax
}

export interface DepsStore {
    store: SessionStore
}

export interface ResourceRejected {
    type: 'rejected'
}

export interface ResourceFail {
    type: 'fail'
}

export type ResourceBad = (ResourceRejected | ResourceFail) & {
    error: string
    statusCode: StatusCode | 0
    detail?: unknown
}

export interface EndpointRequest extends AjaxRequest {
    url: string
    headers?: Record<string, string>
    method: 'GET' | 'PUT' | 'POST' | 'PATCH' | 'DELETE'
}

export const fetchBuilder = <DS extends RES.ResourceDecoders, SC extends keyof DS>(
    doRequest: (apiKey: AccessToken) => EndpointRequest,
    decoder: Lazy<DS>,
    successCodes: Array<SC>
) =>
    pipe(
        buildApiRequests,
        ROR.chainW(b => (deps: DepsAjax) => OR.fromAjax(deps.ajax(doRequest(b)), decoder())),
        ROR.mapLeft(
            (e): ResourceBad => {
                switch (e.type) {
                    case 'unexpectedResponse':
                        return {
                            type: 'fail',
                            statusCode: e.detail.status as StatusCode,
                            error: e.type,
                        }
                    case 'unknownError':
                    case 'appError':
                    case 'networkError':
                        return {
                            type: 'fail',
                            statusCode: 0,
                            error: e.type,
                        }
                    case 'decodeError':
                        return {
                            type: 'fail',
                            error: e.type,
                            statusCode: e.statusCode,
                            detail: e.detail,
                        }
                }
            }
        ),
        ROR.filterOrElseW(
            (r): r is Extract<typeof r, { status: SC }> => successCodes.includes(r.status as SC),
            (r): ResourceBad => {
                if (r.status === 404) {
                    return {
                        type: 'rejected',
                        error: 'notFound',
                        statusCode: r.status as StatusCode,
                    }
                }

                if (r.status >= 400 && r.status <= 499) {
                    return {
                        type: 'rejected',
                        error: 'rejected',
                        statusCode: r.status as StatusCode,
                    }
                }

                return {
                    type: 'fail',
                    error: 'fail',
                    statusCode: r.status as StatusCode,
                }
            }
        ),
        ROR.orElseW(flow(logError, ROR.fromReader, ROR.swap))
    )

export type authAppError = string

const buildApiRequests: ROR.ReaderObservableResource<
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
