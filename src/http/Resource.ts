import type { Applicative2 as RES } from 'fp-ts/Applicative'
import type { Apply2 } from 'fp-ts/Apply'
import type { Bifunctor2 } from 'fp-ts/Bifunctor'
import * as E from 'fp-ts/Either'
import * as Eq from 'fp-ts/Eq'
import type { Functor2 } from 'fp-ts/Functor'
import type { Monad2 } from 'fp-ts/Monad'
import type { Show } from 'fp-ts/Show'
import { constFalse, flow, pipe, Predicate, Refinement } from 'fp-ts/function'
import type { AjaxError, AjaxResponse } from 'rxjs/ajax'
import type { StatusCode } from './statusCode'

// -------------------------------------------------------------------------------------
// model
// -------------------------------------------------------------------------------------

// Init ---------------------------------------------------

export interface ResourceInit {
    readonly _tag: 'init'
}

// Submitted ----------------------------------------------

export interface ResourceSubmitted {
    readonly _tag: 'submitted'
}

// Done ---------------------------------------------------

export interface ResourceData<S, P> {
    readonly status: S
    readonly payload: P
}

export interface ResourceDone<D> {
    readonly _tag: 'done'
    readonly data: D
}

// Fail ---------------------------------------------------

export interface AppErr<AE = never> {
    readonly type: 'appError'
    readonly detail: AE
}

export type ResourceAjaxError<AE = never> =
    | {
          readonly type: 'unknownError'
          readonly detail: unknown
      }
    | (AE extends never ? never : AppErr<AE>)

export type ResourceError<DE, AE = never> =
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
    | ResourceAjaxError<AE>

export interface ResourceAjaxFail<AE = never> {
    readonly _tag: 'fail'
    readonly error: ResourceAjaxError<AE>
}

export interface ResourceFail<E> {
    readonly _tag: 'fail'
    readonly error: E
}

// Resource -----------------------------------------------

export type Resource<E, A> = ResourceInit | ResourceSubmitted | ResourceDone<A> | ResourceFail<E>

export type ResourceAcknowledged<E, A> = ResourceDone<A> | ResourceFail<E>

// ResourceTypeOf -----------------------------------------

export type ResourceDecoders = { [k in StatusCode]?: (i: unknown) => E.Either<unknown, unknown> }

export type ResourceTypeOf<DS extends ResourceDecoders, AE = never> = ResourceInit | ResourceTypeOfStarted<DS, AE>

// ResourceTypeOfStarted ----------------------------------

export type ResourceTypeOfStarted<DS extends ResourceDecoders, AE = never> =
    | ResourceSubmitted
    | ResourceTypeOfAcknowledged<DS, AE>

// ResourceTypeOfAcknowledged -----------------------------

export type ResourceTypeOfAcknowledged<DS extends ResourceDecoders, AE = never> =
    | ResourceTypeOfDone<DS>
    | ResourceTypeOfFail<DS, AE>

// ResourceTypeOfDone -------------------------------------

export type ResourceTypeOfDone<DS extends ResourceDecoders> = ResourceDone<DecodersToResourceData<DS>>
type ExtractRight<C> = C extends (i: unknown) => E.Either<any, infer A> ? A : never
export type DecodersToResourceData<DS> = { [S in keyof DS]: ResourceData<S, ExtractRight<DS[S]>> }[keyof DS]

// ResourceTypeOfFail -------------------------------------

export type ResourceTypeOfFail<DS extends ResourceDecoders, AE = never> = ResourceFail<DecodersToResourceError<DS, AE>>
type ExtractLeft<C> = C extends (i: unknown) => E.Either<infer A, any> ? A : never
export type DecodersToResourceError<DS extends ResourceDecoders, AE> = ResourceError<
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
export const ajaxFail = <AE = never, A = never>(error: ResourceAjaxError<AE>): Resource<ResourceAjaxError<AE>, A> => ({
    _tag: 'fail',
    error: error,
})

// TODO maybe wrong
export const failAppError = <AE, A = never>(detail: AE): Resource<ResourceAjaxError<AE>, A> => ({
    _tag: 'fail',
    error: appError(detail) as any,
})

export const appError = <AE = never>(detail: AE): AppErr<AE> => ({
    type: 'appError',
    detail,
})

export const ajaxFailOnly = <AE = never>(error: ResourceAjaxError<AE>): ResourceFail<ResourceAjaxError<AE>> => ({
    _tag: 'fail',
    error: error,
})

export const fromEither: <E, A>(e: E.Either<E, A>) => Resource<E, A> = E.fold(e => fail(e), done)

// -------------------------------------------------------------------------------------
// Destructors
// -------------------------------------------------------------------------------------

export const match = <E, A, R>(onInit: () => R, onSubmitted: () => R, onDone: (r: A) => R, onFail: (r: E) => R) => (
    r: Resource<E, A>
) => {
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

export const matchD = <E, A, R>(
    dodo:
        | {
              onInit: () => R
              onSubmitted: () => R
              onDone: (r: A) => R
              onFail: (r: E) => R
          }
        | {
              onPending: () => R
              onDone: (r: A) => R
              onFail: (r: E) => R
          }
) =>
    match(
        (dodo as any).onInit || (dodo as any).onPending,
        (dodo as any).onSubmitted || (dodo as any).onPending,
        dodo.onDone,
        dodo.onFail
    )

export const match_ = <E, D>(r: Resource<E, D>) => <R>(
    onInit: () => R,
    onSubmitted: () => R,
    onDone: (r: D) => R,
    onFail: (r: E) => R
): R => pipe(r, match(onInit, onSubmitted, onDone, onFail))

// -------------------------------------------------------------------------------------
// combinators
// -------------------------------------------------------------------------------------

export function orElse<E, A, M>(onFail: (e: E) => Resource<M, A>): (ma: Resource<E, A>) => Resource<M, A> {
    return ma => (isFail(ma) ? onFail(ma.error) : ma)
}

export const filterOrElseW: {
    <A, B extends A, E2>(refinement: Refinement<A, B>, onFalse: (a: A) => E2): <E1>(
        ma: Resource<E1, A>
    ) => Resource<E1 | E2, B>
    <A, E2>(predicate: Predicate<A>, onFalse: (a: A) => E2): <E1>(ma: Resource<E1, A>) => Resource<E1 | E2, A>
} = <A, E2>(predicate: Predicate<A>, onFalse: (a: A) => E2): (<E1>(ma: Resource<E1, A>) => Resource<E1 | E2, A>) =>
    chainW(a => (predicate(a) ? done(a) : fail(onFalse(a))))

export const filterOrElse: {
    <E, A, B extends A>(refinement: Refinement<A, B>, onFalse: (a: A) => E): (ma: Resource<E, A>) => Resource<E, B>
    <E, A>(predicate: Predicate<A>, onFalse: (a: A) => E): (ma: Resource<E, A>) => Resource<E, A>
} = filterOrElseW

// -------------------------------------------------------------------------------------
// type class members
// -------------------------------------------------------------------------------------

export const map: <A, B>(f: (a: A) => B) => <E>(fa: Resource<E, A>) => Resource<E, B> = f => fa =>
    isDone(fa) ? done(f(fa.data)) : fa

export const bimap = <E, G, A, B>(f: (e: E) => G, g: (a: A) => B) => (fa: Resource<E, A>): Resource<G, B> =>
    pipe(
        fa,
        match(
            (): Resource<G, B> => init,
            (): Resource<G, B> => submitted,
            flow(g, done),
            flow(f, fail)
        )
    )

export const mapLeft: <E, G>(f: (e: E) => G) => <A>(fa: Resource<E, A>) => Resource<G, A> = f => fa =>
    isFail(fa) ? fail(f(fa.error)) : fa

export const apW: <D, A>(
    fa: Resource<D, A>
) => <E, B>(fab: Resource<E, (a: A) => B>) => Resource<D | E, B> = fa => fab =>
    // eslint-disable-next-line no-nested-ternary
    isDone(fab) ? (isDone(fa) ? done(fab.data(fa.data)) : fa) : fab

export const ap: <E, A>(fa: Resource<E, A>) => <B>(fab: Resource<E, (a: A) => B>) => Resource<E, B> = apW

export const of: RES<URI>['of'] = done

export const chainW = <D, A, B>(f: (a: A) => Resource<D, B>) => <E>(ma: Resource<E, A>): Resource<D | E, B> =>
    isDone(ma) ? f(ma.data) : ma

export const chain: <E, A, B>(f: (a: A) => Resource<E, B>) => (ma: Resource<E, A>) => Resource<E, B> = chainW

// -------------------------------------------------------------------------------------
// instances
// -------------------------------------------------------------------------------------

/* istanbul ignore next */
const map_: Monad2<URI>['map'] = (fa, f) => pipe(fa, map(f))
/* istanbul ignore next */
const bimap_: Bifunctor2<URI>['bimap'] = (fa, f, g) => pipe(fa, bimap(f, g))
/* istanbul ignore next */
const mapLeft_: Bifunctor2<URI>['mapLeft'] = (fa, f) => pipe(fa, mapLeft(f))
/* istanbul ignore next */
const ap_: Monad2<URI>['ap'] = (fa, f) => pipe(fa, ap(f))
/* istanbul ignore next */
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
            match(
                () => b._tag === 'init',
                () => b._tag === 'submitted',
                fa =>
                    pipe(
                        b,
                        match(constFalse, constFalse, fb => EA.equals(fa, fb), constFalse)
                    ),
                sa =>
                    pipe(
                        b,
                        match(constFalse, constFalse, constFalse, sb => EL.equals(sa, sb))
                    )
            )
        )
    )
}

export const Functor: Functor2<URI> = {
    URI,
    map: map_,
}

export const Apply: Apply2<URI> = {
    URI,
    map: map_,
    ap: ap_,
}

export const Bifunctor: Bifunctor2<URI> = {
    URI,
    bimap: bimap_,
    mapLeft: mapLeft_,
}

export const Applicative: RES<URI> = {
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

export const resource: Monad2<URI> & Bifunctor2<URI> = {
    URI,
    map: map_,
    bimap: bimap_,
    mapLeft: mapLeft_,
    of,
    ap: ap_,
    chain: chain_,
}
