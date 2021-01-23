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
    readonly _tag: 'init'
}

export interface ResourceSubmitted {
    readonly _tag: 'submitted'
}

export interface ResourceData<S, P> {
    readonly status: S
    readonly payload: P
}

export interface ResourceDone<D> {
    readonly _tag: 'done'
    readonly data: D
}

export type ResourceDataError<DE, AE = never> =
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
    | ResourceAjaxDataError<AE>

export interface ResourceFail<E> {
    readonly _tag: 'fail'
    readonly error: E
}

type ResourceAjaxDataError<AE = never> =
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

export interface ResourceAjaxFail<AE = never> {
    readonly _tag: 'fail'
    readonly error: ResourceAjaxDataError<AE>
}

export type Resource<E, D> = ResourceInit | ResourceSubmitted | ResourceDone<D> | ResourceFail<E>

export type AjaxSubject<AE = never> = Observable<AjaxResponse | ResourceAjaxFail<AE>>
export type ResourceDecoders = { [k in StatusCode]?: (i: unknown) => E.Either<unknown, unknown> }

export type ResourceTypeOf<DS extends ResourceDecoders, AE = never> = ResourceInit | ResourceTypeOfStarted<DS, AE>

export type ResourceTypeOfStarted<DS extends ResourceDecoders, AE = never> =
    | ResourceSubmitted
    | ResourceTypeOfAcknowledged<DS, AE>

export type ResourceTypeOfAcknowledged<DS extends ResourceDecoders, AE = never> =
    | ResourceTypeOfDone<DS>
    | ResourceTypeOfFail<DS, AE>

export type ResourceTypeOfDone<DS extends ResourceDecoders> = ResourceDone<DecodersToResourceData<DS>>

export type ResourceTypeOfFail<DS extends ResourceDecoders, AE = never> = ResourceFail<
    DecodersToResourceDataError<DS, AE>
>

type ExtractRight<C> = C extends (i: unknown) => E.Either<any, infer A> ? A : never

type DecodersToResourceData<DS> = { [S in keyof DS]: ResourceData<S, ExtractRight<DS[S]>> }[keyof DS]

type ExtractLeft<C> = C extends (i: unknown) => E.Either<infer A, any> ? A : never
type DecodersToDE<DS> = { [S in keyof DS]: ExtractLeft<DS[S]> }[keyof DS]
type DecodersToResourceDataError<DS extends ResourceDecoders, AE> = ResourceDataError<DecodersToDE<DS>, AE>

const dict: { [k in AjaxErrorNames]: true } = {
    AjaxError: true,
    AjaxTimeoutError: true,
}

// -------------------------------------------------------------------------------------
// instances
// -------------------------------------------------------------------------------------

export const URI = 'Resource'

export type URI = typeof URI

declare module 'fp-ts/HKT' {
    interface URItoKind2<E, A> {
        readonly [URI]: Resource<E, A>
    }
}

// -------------------------------------------------------------------------------------
// utility
// -------------------------------------------------------------------------------------

const isResourceAjaxFail = <AE>(r: any | ResourceAjaxFail<AE>): r is ResourceAjaxFail<AE> => r._tag === 'fail'

const isAjaxError = (e: any): e is AjaxError => Object.prototype.hasOwnProperty.call(dict, e.name)

const applyDecoder = <DS extends ResourceDecoders>(decoders: DS) => <AE>(
    response: AjaxResponse | AjaxError | ResourceAjaxFail<AE>
): ResourceTypeOfAcknowledged<DS, AE> => {
    if (isResourceAjaxFail(response)) {
        return response as ResourceTypeOfFail<DS, AE>
    }

    const status = response.status as StatusCode
    const decoder = decoders[status]

    if (decoder) {
        return pipe(
            decoder(response.response),
            E.map(payload => resourceDone({ status, payload }) as ResourceTypeOfDone<DS>),
            E.getOrElseW(
                e =>
                    resourceFail({
                        type: 'decodeError',
                        detail: e,
                    }) as ResourceTypeOfFail<DS, AE>
            )
        )
    }

    return resourceFail<DecodersToResourceDataError<DS, AE>>({ type: 'unexpectedResponse', detail: response })
}

// -------------------------------------------------------------------------------------
// Guards
// -------------------------------------------------------------------------------------

export const isResourceInit = <E, D>(r: Resource<E, D>): r is ResourceInit => r._tag === 'init'

export const isResourceSubmitted = <E, D>(r: Resource<E, D>): r is ResourceSubmitted => r._tag === 'submitted'

export const isResourceDone = <E, D>(r: Resource<E, D>): r is ResourceDone<D> => r._tag === 'done'

export const isResourceFail = <E, D>(r: Resource<E, D>): r is ResourceFail<E> => r._tag === 'fail'

export const isResourcePending = <E, D>(r: Resource<E, D>): r is ResourceInit | ResourceSubmitted =>
    isResourceInit(r) || isResourceSubmitted(r)

export const isResourceStarted = <E, D>(
    r: Resource<E, D>
): r is ResourceSubmitted | ResourceFail<E> | ResourceDone<D> =>
    isResourceSubmitted(r) || isResourceFail(r) || isResourceDone(r)

export const isResourceAcknowledged = <E, D>(r: Resource<E, D>): r is ResourceFail<E> | ResourceDone<D> =>
    isResourceFail(r) || isResourceDone(r)

// -------------------------------------------------------------------------------------
// Constructors
// -------------------------------------------------------------------------------------

export const resourceInit: ResourceInit = { _tag: 'init' }
export const resourceSubmitted: ResourceSubmitted = { _tag: 'submitted' }
export const resourceDone = <D>(d: D): ResourceDone<D> => ({
    _tag: 'done',
    data: d,
})
export const resourceFail = <E>(error: E): ResourceFail<E> => ({
    _tag: 'fail',
    error: error,
})
export const resourceAjaxFail = <AE = never>(error: ResourceAjaxDataError<AE>): ResourceAjaxFail<AE> => ({
    _tag: 'fail',
    error: error,
})

// -------------------------------------------------------------------------------------
// combinators
// -------------------------------------------------------------------------------------

export const ajaxToResource = <DS extends ResourceDecoders, AE = never>(
    ajax$: AjaxSubject<AE>,
    decoders: DS
): Observable<ResourceTypeOfStarted<DS, AE>> =>
    concat(
        of(resourceSubmitted),
        ajax$.pipe(
            map(applyDecoder(decoders)),
            catchError(
                (e: unknown): Observable<ResourceTypeOfAcknowledged<DS, AE>> =>
                    of(
                        isAjaxError(e)
                            ? applyDecoder(decoders)(e)
                            : resourceFail<DecodersToResourceDataError<DS, AE>>({ type: 'unknownError', detail: e })
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

export const resourceFold = <E, D, R>(dodo: {
    onInit: () => R
    onSubmitted: () => R
    onDone: (r: ResourceDone<D>['data']) => R
    onFail: (r: ResourceFail<E>['error']) => R
}) => (resource: Resource<E, D>) => {
    switch (resource._tag) {
        case 'init':
            return dodo.onInit()
        case 'submitted':
            return dodo.onSubmitted()
        case 'done':
            return dodo.onDone(resource.data)
        case 'fail':
            return dodo.onFail(resource.error)
    }
}

export const resourceFold_ = <E, D>(resource: Resource<E, D>) => <R>(dodo: {
    onInit: () => R
    onSubmitted: () => R
    onDone: (r: ResourceDone<D>['data']) => R
    onFail: (r: ResourceFail<E>['error']) => R
}): R => pipe(resource, resourceFold(dodo))
