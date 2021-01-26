import type { Applicative2 } from 'fp-ts/Applicative'
import type * as E from 'fp-ts/Either'
import * as Eq from 'fp-ts/lib/Eq'
import type { Functor2 } from 'fp-ts/lib/Functor'
import type { Monad2 } from 'fp-ts/lib/Monad'
import type { Show } from 'fp-ts/lib/Show'
import { constFalse } from 'fp-ts/lib/function'
import { pipe } from 'fp-ts/pipeable'
import type { AjaxError, AjaxResponse } from 'rxjs/ajax'
import type { StatusCode } from './statusCode'

// -------------------------------------------------------------------------------------
// model
// -------------------------------------------------------------------------------------

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

export type ResourceAjaxDataError<AE = never> =
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

export type ResourceAcknowledged<E, D> = ResourceDone<D> | ResourceFail<E>

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
export type DecodersToResourceData<DS> = { [S in keyof DS]: ResourceData<S, ExtractRight<DS[S]>> }[keyof DS]

type ExtractLeft<C> = C extends (i: unknown) => E.Either<infer A, any> ? A : never
export type DecodersToResourceDataError<DS extends ResourceDecoders, AE> = ResourceDataError<
    { [S in keyof DS]: ExtractLeft<DS[S]> }[keyof DS],
    AE
>

// -------------------------------------------------------------------------------------
// guards
// -------------------------------------------------------------------------------------

export const isInit = <E, D>(r: Resource<E, D>): r is ResourceInit => r._tag === 'init'

export const isSubmitted = <E, D>(r: Resource<E, D>): r is ResourceSubmitted => r._tag === 'submitted'

export const isDone = <E, D>(r: Resource<E, D>): r is ResourceDone<D> => r._tag === 'done'

export const isFail = <E, D>(r: Resource<E, D>): r is ResourceFail<E> => r._tag === 'fail'

export const isPending = <E, D>(r: Resource<E, D>): r is ResourceInit | ResourceSubmitted => isInit(r) || isSubmitted(r)

export const isStarted = <E, D>(r: Resource<E, D>): r is ResourceSubmitted | ResourceFail<E> | ResourceDone<D> =>
    isSubmitted(r) || isFail(r) || isDone(r)

export const isAcknowledged = <E, D>(r: Resource<E, D>): r is ResourceFail<E> | ResourceDone<D> =>
    isFail(r) || isDone(r)

// -------------------------------------------------------------------------------------
// constructors
// -------------------------------------------------------------------------------------

export const init: Resource<never, never> = { _tag: 'init' }
export const submitted: Resource<never, never> = { _tag: 'submitted' }
export const done = <E = never, A = never>(d: A): Resource<E, A> => ({
    _tag: 'done',
    data: d,
})
export const fail = <E = never, A = never>(error: E): Resource<E, A> => ({
    _tag: 'fail',
    error: error,
})
export const ajaxFail = <AE = never>(error: ResourceAjaxDataError<AE>): ResourceAjaxFail<AE> => ({
    _tag: 'fail',
    error: error,
})

// -------------------------------------------------------------------------------------
// Destructors
// -------------------------------------------------------------------------------------

export const fold = <E, D, R>(
    onInit: () => R,
    onSubmitted: () => R,
    onDone: (r: ResourceDone<D>['data']) => R,
    onFail: (r: ResourceFail<E>['error']) => R
) => (r: Resource<E, D>) => {
    switch (r._tag) {
        case 'init':
            return onInit()
        case 'submitted':
            return onSubmitted()
        case 'done':
            return onDone(r.data)
        case 'fail':
            return onFail(r.error)
    }
}

export const resourceFold = <E, D, R>(dodo: {
    onInit: () => R
    onSubmitted: () => R
    onDone: (r: ResourceDone<D>['data']) => R
    onFail: (r: ResourceFail<E>['error']) => R
}) => fold(dodo.onInit, dodo.onSubmitted, dodo.onDone, dodo.onFail)

export const fold_ = <E, D>(r: Resource<E, D>) => <R>(
    onInit: () => R,
    onSubmitted: () => R,
    onDone: (r: ResourceDone<D>['data']) => R,
    onFail: (r: ResourceFail<E>['error']) => R
): R => pipe(r, fold(onInit, onSubmitted, onDone, onFail))

// -------------------------------------------------------------------------------------
// type class members
// -------------------------------------------------------------------------------------

export const map: <A, B>(f: (a: A) => B) => <E>(fa: Resource<E, A>) => Resource<E, B> = f => fa =>
    isDone(fa) ? done(f(fa.data)) : fa

export const mapFail: <E, G>(f: (e: E) => G) => <A>(fa: Resource<E, A>) => Resource<G, A> = f => fa =>
    isFail(fa) ? fail(f(fa.error)) : fa

export const apW: <D, A>(
    fa: Resource<D, A>
) => <E, B>(fab: Resource<E, (a: A) => B>) => Resource<D | E, B> = fa => fab =>
    // eslint-disable-next-line no-nested-ternary
    isDone(fab) ? (isDone(fa) ? done(fab.data(fa.data)) : fa) : fab

export const ap: <E, A>(fa: Resource<E, A>) => <B>(fab: Resource<E, (a: A) => B>) => Resource<E, B> = apW

export const of: Applicative2<URI>['of'] = done

export const chainW = <D, A, B>(f: (a: A) => Resource<D, B>) => <E>(ma: Resource<E, A>): Resource<D | E, B> =>
    isDone(ma) ? f(ma.data) : ma

export const chain: <E, A, B>(f: (a: A) => Resource<E, B>) => (ma: Resource<E, A>) => Resource<E, B> = chainW

// -------------------------------------------------------------------------------------
// instances
// -------------------------------------------------------------------------------------

const map_: Monad2<URI>['map'] = (fa, f) => pipe(fa, map(f))
const ap_: Monad2<URI>['ap'] = (fa, f) => pipe(fa, ap(f))
const chain_: Monad2<URI>['chain'] = (fa, f) => pipe(fa, chain(f))

export const URI = 'Resource'

export type URI = typeof URI

declare module 'fp-ts/HKT' {
    interface URItoKind2<E, A> {
        readonly [URI]: Resource<E, A>
    }
}

export function getShow<E, A>(SE: Show<E>, SA: Show<A>): Show<Resource<E, A>> {
    return {
        show: ma => {
            switch (ma._tag) {
                case 'done':
                    return `done(${SA.show(ma.data)})`
                case 'fail':
                    return `fail(${SE.show(ma.error)})`
                case 'submitted':
                    return 'submitted'
                case 'init':
                    return 'init'
            }
        },
    }
}

export function getEq<E, A>(EL: Eq.Eq<E>, EA: Eq.Eq<A>): Eq.Eq<Resource<E, A>> {
    return Eq.fromEquals((a, b) =>
        pipe(
            a,
            fold(
                () => b._tag === 'init',
                () => b._tag === 'submitted',
                fa =>
                    pipe(
                        b,
                        fold(constFalse, constFalse, fb => EA.equals(fa, fb), constFalse)
                    ),
                sa =>
                    pipe(
                        b,
                        fold(constFalse, constFalse, constFalse, sb => EL.equals(sa, sb))
                    )
            )
        )
    )
}

export const Functor: Functor2<URI> = {
    URI,
    map: map_,
}

export const Applicative: Applicative2<URI> = {
    URI,
    map: map_,
    ap: ap_,
    of,
}

export const Monad: Monad2<URI> = {
    URI,
    map: map_,
    ap: ap_,
    of,
    chain: chain_,
}

export const resource: Monad2<URI> = {
    URI,
    map: map_,
    of,
    ap: ap_,
    chain: chain_,
}
