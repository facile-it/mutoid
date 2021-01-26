import * as R from 'fp-ts-rxjs/Observable'
import * as E from 'fp-ts/Either'
import { flow } from 'fp-ts/lib/function'
import { pipe } from 'fp-ts/pipeable'
import { Observable, concat, of } from 'rxjs'
import type { AjaxError, AjaxResponse } from 'rxjs/ajax'
// eslint-disable-next-line rxjs/no-internal
import type { AjaxErrorNames } from 'rxjs/internal/observable/dom/AjaxObservable'
import { catchError, map, switchMap, take } from 'rxjs/operators'
import * as RES from './Resource'
import type { StatusCode } from './statusCode'

// -------------------------------------------------------------------------------------
// model
// -------------------------------------------------------------------------------------

export type ObservableResource<E, A> = Observable<RES.Resource<E, A>>

// -------------------------------------------------------------------------------------
// constructors
// -------------------------------------------------------------------------------------

export const init: ObservableResource<never, never> = R.of(RES.init)
export const submitted: ObservableResource<never, never> = R.of(RES.submitted)
export const done: <E = never, A = never>(d: A) => ObservableResource<E, A> = flow(RES.done, R.of)
export const fail: <E = never, A = never>(error: E) => ObservableResource<E, A> = flow(RES.fail, R.of)
export const ajaxFail: <AE = never>(
    error: RES.ResourceAjaxDataError<AE>
) => Observable<RES.ResourceAjaxFail<AE>> = flow(RES.ajaxFail, R.of)

export type AjaxSubject<AE = never> = Observable<AjaxResponse | RES.ResourceAjaxFail<AE>>

export const fromAjax = <DS extends RES.ResourceDecoders, AE = never>(
    ajax$: AjaxSubject<AE>,
    decoders: DS
): Observable<RES.ResourceTypeOfStarted<DS, AE>> =>
    concat(
        submitted as Observable<RES.ResourceSubmitted>,
        ajax$.pipe(
            map(decodeResponse(decoders)),
            catchError(
                (e: unknown): Observable<RES.ResourceTypeOfAcknowledged<DS, AE>> =>
                    of(
                        isAjaxError(e)
                            ? decodeResponse(decoders)(e)
                            : (RES.fail({ type: 'unknownError', detail: e }) as RES.ResourceTypeOfFail<DS, AE>)
                    )
            )
        )
    ).pipe(take(2))

// -------------------------------------------------------------------------------------
// destructors
// -------------------------------------------------------------------------------------

export const toMutationEffect = <
    AJ extends (...args: any) => Observable<R>,
    SS extends S,
    S,
    I extends Array<any> = Parameters<AJ>,
    R = AJ extends (...args: any) => Observable<infer R> ? R : never
>(
    aj: AJ,
    apOperators: (i: Observable<R>, s: SS) => Observable<S>
) => (...i: I) => (s: SS): Observable<S> => aj(...i).pipe(switchMap(r => apOperators(of(r), s)))

// -------------------------------------------------------------------------------------
// instances
// -------------------------------------------------------------------------------------

export const URI = 'ObservableResource'

export type URI = typeof URI

declare module 'fp-ts/HKT' {
    interface URItoKind2<E, A> {
        readonly [URI]: ObservableResource<E, A>
    }
}

// -------------------------------------------------------------------------------------
// utils
// -------------------------------------------------------------------------------------

const dict: { [k in AjaxErrorNames]: true } = {
    AjaxError: true,
    AjaxTimeoutError: true,
}

function isResourceAjaxFail<AE>(r: any | RES.ResourceAjaxFail<AE>): r is RES.ResourceAjaxFail<AE> {
    return r._tag === 'fail'
}

function isAjaxError(e: any): e is AjaxError {
    return Object.prototype.hasOwnProperty.call(dict, e.name)
}

const decodeResponse = <DS extends RES.ResourceDecoders>(decoders: DS) => <AE>(
    response: AjaxResponse | AjaxError | RES.ResourceAjaxFail<AE>
): RES.ResourceTypeOfAcknowledged<DS, AE> => {
    if (isResourceAjaxFail(response)) {
        return response as RES.ResourceTypeOfFail<DS, AE>
    }

    const status = response.status as StatusCode
    const decoder = decoders[status]

    if (decoder) {
        return pipe(
            decoder(response.response),
            E.map(payload => RES.done({ status, payload }) as RES.ResourceTypeOfDone<DS>),
            E.getOrElseW(
                e =>
                    RES.fail({
                        type: 'decodeError',
                        detail: e,
                    }) as RES.ResourceTypeOfFail<DS, AE>
            )
        )
    }

    return RES.fail({
        type: 'unexpectedResponse',
        detail: response,
    }) as RES.ResourceTypeOfFail<DS, AE>
}
