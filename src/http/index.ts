import * as E from 'fp-ts/Either'
import { pipe } from 'fp-ts/pipeable'
import { Observable, concat, of } from 'rxjs'
import type { AjaxError, AjaxResponse } from 'rxjs/ajax'
// eslint-disable-next-line rxjs/no-internal
import type { AjaxErrorNames } from 'rxjs/internal/observable/dom/AjaxObservable'
import { catchError, map, switchMap, take } from 'rxjs/operators'
import type { StatusCode } from './status'

// type

export interface ResourceInit {
    readonly tag: 'init'
}

export interface ResourceSubmitted {
    readonly tag: 'submitted'
}

export interface ResourceDone<S, P> {
    readonly tag: 'done'
    readonly status: S
    readonly payload: P
}

export interface ResourceFail<DE, AE = never> {
    readonly tag: 'fail'
    readonly error:
        | {
              readonly type: 'decodeError'
              readonly detail: DE
          }
        | {
              readonly type: 'networkError'
              readonly detail: AjaxError
          }
        | {
              readonly type: 'unexpectedResponse'
              readonly detail: AjaxResponse | AjaxError
          }
        | ResourceAjaxFail<AE>['error']
}

export interface ResourceAjaxFail<AE = never> {
    readonly tag: 'fail'
    readonly error:
        | {
              readonly type: 'unknownError'
              readonly detail: unknown
          }
        | (AE extends never
              ? never
              : {
                    readonly type: 'appError'
                    readonly detail: AE
                })
}

export type AjaxSubject<AE = never> = Observable<AjaxResponse | ResourceAjaxFail<AE>>

export type ResourceDecoders = { [k in StatusCode]?: (i: unknown) => E.Either<unknown, unknown> }
export type Resource<DS extends ResourceDecoders, AE = never> = ResourceInit | ResourceStarted<DS, AE>
export type ResourceStarted<DS extends ResourceDecoders, AE = never> = ResourceSubmitted | ResourceAcknowledged<DS, AE>
export type ResourceAcknowledged<DS extends ResourceDecoders, AE = never> =
    | DecodersDictToResourceDone<DS>
    | DecodersToResourceFail<DS, AE>

type ExtractRight<C> = C extends (i: unknown) => E.Either<any, infer A> ? A : never
type DecodersToResourceDone<DS> = { [S in keyof DS]: ResourceDone<S, ExtractRight<DS[S]>> }[keyof DS]
type DecodersDictToResourceDone<DS extends ResourceDecoders, RD = DecodersToResourceDone<DS>> = RD extends undefined
    ? never
    : RD

type ExtractLeft<C> = C extends (i: unknown) => E.Either<infer A, any> ? A : never
type DecodersToDE<DS> = { [S in keyof DS]: ExtractLeft<DS[S]> }[keyof DS]
type DecodersToResourceFail<
    DS extends ResourceDecoders,
    AE,
    RF = ResourceFail<DecodersToDE<DS>, AE>
> = RF extends undefined ? never : RF

const dict: { [k in AjaxErrorNames]: true } = {
    AjaxError: true,
    AjaxTimeoutError: true,
}

// -------------------------------------------------------------------------------------
// utility
// -------------------------------------------------------------------------------------

const isResourceAjaxFail = <AE>(r: any | ResourceAjaxFail<AE>): r is ResourceAjaxFail<AE> => r.tag === 'fail'

const isAjaxError = (e: any): e is AjaxError => Object.prototype.hasOwnProperty.call(dict, e.name)

const applyDecoder = <DS extends ResourceDecoders>(decoders: DS) => <AE>(
    response: AjaxResponse | AjaxError | ResourceAjaxFail<AE>
): ResourceAcknowledged<DS, AE> => {
    if (isResourceAjaxFail(response)) {
        return response as DecodersToResourceFail<DS, AE>
    }

    const status = response.status as StatusCode
    const decoder = decoders[status]

    if (decoder) {
        return pipe(
            decoder(response.response),
            E.map(decoded => resourceDone(status, decoded) as DecodersDictToResourceDone<DS>),
            E.getOrElseW(
                e =>
                    resourceFail({
                        type: 'decodeError',
                        detail: e,
                    }) as DecodersToResourceFail<DS, AE>
            )
        )
    }

    return resourceFail<DecodersToDE<DS>, AE>({ type: 'unexpectedResponse', detail: response })
}

// -------------------------------------------------------------------------------------
// Guards
// -------------------------------------------------------------------------------------

export const isResourceInit = <DS extends ResourceDecoders, AE = never>(
    r: Resource<DS, AE>
): r is Extract<typeof r, { tag: 'init' }> => r.tag === 'init'

export const isResourceSubmitted = <DS extends ResourceDecoders, AE = never>(
    r: Resource<DS, AE>
): r is Extract<typeof r, { tag: 'submitted' }> => r.tag === 'submitted'

export const isResourceDone = <DS extends ResourceDecoders, AE = never>(
    r: Resource<DS, AE>
): r is Extract<typeof r, { tag: 'done' }> => r.tag === 'done'

export const isResourceFail = <DS extends ResourceDecoders, AE = never>(
    r: Resource<DS, AE>
): r is Extract<typeof r, { tag: 'fail' }> => r.tag === 'fail'

export const isResourcePending = <DS extends ResourceDecoders, AE = never>(
    r: Resource<DS, AE>
): r is Extract<typeof r, { tag: 'init' | 'submitted' }> => isResourceInit(r) || isResourceSubmitted(r)

export const isResourceStarted = <DS extends ResourceDecoders, AE = never>(
    r: Resource<DS, AE>
): r is Extract<typeof r, { tag: 'submitted' | 'fail' | 'done' }> =>
    isResourceSubmitted(r) || isResourceFail(r) || isResourceDone(r)

export const isResourceAcknowledged = <DS extends ResourceDecoders, AE = never>(
    r: Resource<DS, AE>
): r is Extract<typeof r, { tag: 'fail' | 'done' }> => isResourceFail(r) || isResourceDone(r)

// -------------------------------------------------------------------------------------
// Constructors
// -------------------------------------------------------------------------------------

export const resourceInit: ResourceInit = { tag: 'init' }
export const resourceSubmitted: ResourceSubmitted = { tag: 'submitted' }
export const resourceDone = <S, P>(status: S, payload: P): ResourceDone<S, P> => ({
    tag: 'done',
    status: status,
    payload: payload,
})
export const resourceFail = <DE, AE = never>(error: ResourceFail<DE, AE>['error']): ResourceFail<DE, AE> => ({
    tag: 'fail',
    error: error,
})
export const resourceAjaxFail = <AE = never>(error: ResourceAjaxFail<AE>['error']): ResourceAjaxFail<AE> => ({
    tag: 'fail',
    error: error,
})

// -------------------------------------------------------------------------------------
// combinators
// -------------------------------------------------------------------------------------

export const ajaxToResource = <DS extends ResourceDecoders, AE = never>(
    ajax$: AjaxSubject<AE>,
    decoders: DS
): Observable<ResourceStarted<DS, AE>> =>
    concat(
        of(resourceSubmitted),
        ajax$.pipe(
            map(applyDecoder(decoders)),
            catchError(
                (e: unknown): Observable<ResourceAcknowledged<DS, AE>> =>
                    of(
                        isAjaxError(e)
                            ? applyDecoder(decoders)(e)
                            : resourceFail<DecodersToDE<DS>, AE>({ type: 'unknownError', detail: e })
                    )
            )
        )
    ).pipe(take(2))

export const resourceFetcherToMutationEffect = <
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
// Destructors
// -------------------------------------------------------------------------------------

export const resourceFold = <DS extends ResourceDecoders, AE, R>(dodo: {
    onInit: () => R
    onSubmitted: () => R
    onDone: (r: Extract<Resource<DS, AE>, { tag: 'done' }>) => R
    onFail: (r: Extract<Resource<DS, AE>, { tag: 'fail' }>) => R
}) => (resource: Resource<DS, AE>) => {
    switch (resource.tag) {
        case 'init':
            return dodo.onInit()
        case 'submitted':
            return dodo.onSubmitted()
        case 'done':
            return dodo.onDone(resource)
        case 'fail':
            return dodo.onFail(resource)
    }
}

export const resourceFold_ = <DS extends ResourceDecoders, AE>(resource: Resource<DS, AE>) => <R>(dodo: {
    onInit: () => R
    onSubmitted: () => R
    onDone: (r: Extract<Resource<DS, AE>, { tag: 'done' }>) => R
    onFail: (r: Extract<Resource<DS, AE>, { tag: 'fail' }>) => R
}): R => pipe(resource, resourceFold(dodo))
