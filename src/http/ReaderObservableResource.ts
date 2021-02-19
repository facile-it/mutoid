import type { ReaderObservableEither } from 'fp-ts-rxjs/ReaderObservableEither'
import type { MonadObservable3 } from 'fp-ts-rxjs/lib/MonadObservable'
import type { Applicative3 } from 'fp-ts/lib/Applicative'
import type { Apply3 } from 'fp-ts/lib/Apply'
import type { Bifunctor3 } from 'fp-ts/lib/Bifunctor'
import type { Functor3 } from 'fp-ts/lib/Functor'
import type { Monad3 } from 'fp-ts/lib/Monad'
import type { MonadIO3 } from 'fp-ts/lib/MonadIO'
import type { MonadTask3 } from 'fp-ts/lib/MonadTask'
import * as R from 'fp-ts/lib/Reader'
import { flow, identity, pipe, Predicate, Refinement } from 'fp-ts/lib/function'
import type { Observable } from 'rxjs'
import * as RXoP from 'rxjs/operators'
import * as OR from './ObservableResource'
import type * as RES from './Resource'

// -------------------------------------------------------------------------------------
// model
// -------------------------------------------------------------------------------------

export interface ReaderObservableResource<R, E, A> {
    (r: R): OR.ObservableResource<E, A>
}

export type ObservableResourceTypeOf<R, DS extends RES.ResourceDecoders, AE = never> = ReaderObservableResource<
    R,
    RES.DecodersToResourceError<DS, AE>,
    RES.DecodersToResourceData<DS>
>

// -------------------------------------------------------------------------------------
// constructors
// -------------------------------------------------------------------------------------

export const fromObservableResource: <R, E, A>(ma: OR.ObservableResource<E, A>) => ReaderObservableResource<R, E, A> =
    R.of

export const init: ReaderObservableResource<never, never, never> = () => OR.init
export const submitted: ReaderObservableResource<never, never, never> = () => OR.submitted

export const done: <R, E = never, A = never>(d: A) => ReaderObservableResource<R, E, A> = flow(
    OR.done,
    fromObservableResource
)
export const doneObservable: <R, E = never, A = never>(oa: Observable<A>) => ReaderObservableResource<R, E, A> = flow(
    OR.doneObservable,
    fromObservableResource
)

export const fail: <R, E = never, A = never>(e: E) => ReaderObservableResource<R, E, A> = flow(
    OR.fail,
    fromObservableResource
)
export const failObservable: <R, E = never, A = never>(oe: Observable<E>) => ReaderObservableResource<R, E, A> = flow(
    OR.failObservable,
    fromObservableResource
)

export const ask: <R, E>() => ReaderObservableResource<R, E, R> = () => OR.done

export const asks: <R, E, A>(f: (r: R) => A) => ReaderObservableResource<R, E, A> = f => flow(OR.done, OR.map(f))

export const fromReader: <R, E, A>(ma: R.Reader<R, A>) => ReaderObservableResource<R, E, A> = ma => flow(ma, OR.done)

export const fromTask: MonadTask3<URI>['fromTask'] = ma => () => OR.fromTask(ma)

export const fromObservable: MonadObservable3<URI>['fromObservable'] = ma => () => OR.doneObservable(ma)

export const fromReaderObservableEither = <R, E, A>(
    e: ReaderObservableEither<R, E, A>
): ReaderObservableResource<R, E, A> => flow(e, OR.fromObservableEither)

export const fromIO: MonadIO3<URI>['fromIO'] = ma => () => OR.rightIO(ma)

export const fromAjax = flow(OR.fromAjax, fromObservableResource)

// -------------------------------------------------------------------------------------
// destructors
// -------------------------------------------------------------------------------------

export const toMutation = <R, E, A, S, SS extends S>(mapTo: (r: RES.Resource<E, A>) => (s: SS) => S) => (
    ros: ReaderObservableResource<R, E, A>
) => flow(ros, c => c.pipe(RXoP.map(mapTo)))

// -------------------------------------------------------------------------------------
// combinators
// -------------------------------------------------------------------------------------

export const local: <R2, R1>(
    f: (d: R2) => R1
) => <E, A>(ma: ReaderObservableResource<R1, E, A>) => ReaderObservableResource<R2, E, A> = R.local

export function orElse<R, E, A, M>(
    onLeft: (e: E) => ReaderObservableResource<R, M, A>
): (ma: ReaderObservableResource<R, E, A>) => ReaderObservableResource<R, M, A> {
    return ma => r => OR.orElse<E, A, M>(e => onLeft(e)(r))(ma(r))
}

export const filterOrElseW: {
    <A, B extends A, E2>(refinement: Refinement<A, B>, onFalse: (a: A) => E2): <R, E1>(
        ma: ReaderObservableResource<R, E1, A>
    ) => ReaderObservableResource<R, E1 | E2, B>
    <A, E2>(predicate: Predicate<A>, onFalse: (a: A) => E2): <R, E1>(
        ma: ReaderObservableResource<R, E1, A>
    ) => ReaderObservableResource<R, E1 | E2, A>
} = <A, E2>(
    predicate: Predicate<A>,
    onFalse: (a: A) => E2
): (<R, E1>(ma: ReaderObservableResource<R, E1, A>) => ReaderObservableResource<R, E1 | E2, A>) =>
    chainW(a => (predicate(a) ? done(a) : fail(onFalse(a))))

export const filterOrElse: {
    <E, A, B extends A>(refinement: Refinement<A, B>, onFalse: (a: A) => E): <R>(
        ma: ReaderObservableResource<R, E, A>
    ) => ReaderObservableResource<R, E, B>
    <E, A>(predicate: Predicate<A>, onFalse: (a: A) => E): <R>(
        ma: ReaderObservableResource<R, E, A>
    ) => ReaderObservableResource<R, E, A>
} = filterOrElseW

// -------------------------------------------------------------------------------------
// type class members
// -------------------------------------------------------------------------------------

export const map: <A, B>(
    f: (a: A) => B
) => <R, E>(fa: ReaderObservableResource<R, E, A>) => ReaderObservableResource<R, E, B> = f => fa => flow(fa, OR.map(f))

export const bimap: <E, G, A, B>(
    f: (e: E) => G,
    g: (a: A) => B
) => <R>(fa: ReaderObservableResource<R, E, A>) => ReaderObservableResource<R, G, B> = (f, g) => fea => r =>
    OR.bimap(f, g)(fea(r))

export const mapLeft: <E, G>(
    f: (e: E) => G
) => <R, A>(fa: ReaderObservableResource<R, E, A>) => ReaderObservableResource<R, G, A> = f => fea => r =>
    OR.mapLeft(f)(fea(r))

export const ap: <R, E, A>(
    fa: ReaderObservableResource<R, E, A>
) => <B>(fab: ReaderObservableResource<R, E, (a: A) => B>) => ReaderObservableResource<R, E, B> = fa => fab => r =>
    pipe(fab(r), OR.ap(fa(r)))

export const chainW = <A, R2, E2, B>(f: (a: A) => ReaderObservableResource<R2, E2, B>) => <R1, E1>(
    ma: ReaderObservableResource<R1, E1, A>
): ReaderObservableResource<R1 & R2, E1 | E2, B> => r =>
    pipe(
        ma(r),
        OR.chainW(a => f(a)(r))
    )

export const chain: <R, E, A, B>(
    f: (a: A) => ReaderObservableResource<R, E, B>
) => (ma: ReaderObservableResource<R, E, A>) => ReaderObservableResource<R, E, B> = chainW

export const flatten: <R, E, A>(
    mma: ReaderObservableResource<R, E, ReaderObservableResource<R, E, A>>
) => ReaderObservableResource<R, E, A> = chain(identity)

export const of: Applicative3<URI>['of'] = done

// -------------------------------------------------------------------------------------
// instances
// -------------------------------------------------------------------------------------

/* istanbul ignore next */
const map_: Functor3<URI>['map'] = (fa, f) => pipe(fa, map(f))
/* istanbul ignore next */
const ap_: Apply3<URI>['ap'] = (fab, fa) => pipe(fab, ap(fa))
/* istanbul ignore next */
const chain_: Monad3<URI>['chain'] = (ma, f) => pipe(ma, chain(f))
/* istanbul ignore next */
const bimap_: Bifunctor3<URI>['bimap'] = (fea, f, g) => pipe(fea, bimap(f, g))
/* istanbul ignore next */
const mapLeft_: Bifunctor3<URI>['mapLeft'] = (fea, f) => pipe(fea, mapLeft(f))

export const URI = 'ReaderObservableResource'

export type URI = typeof URI

declare module 'fp-ts/HKT' {
    export interface URItoKind3<R, E, A> {
        readonly [URI]: ReaderObservableResource<R, E, A>
    }
}

export const Functor: Functor3<URI> = {
    URI,
    map: map_,
}

export const Apply: Apply3<URI> = {
    URI,
    map: map_,
    ap: ap_,
}

export const Applicative: Applicative3<URI> = {
    URI,
    map: map_,
    ap: ap_,
    of,
}

export const Monad: Monad3<URI> = {
    URI,
    map: map_,
    ap: ap_,
    of,
    chain: chain_,
}

export const Bifunctor: Bifunctor3<URI> = {
    URI,
    bimap: bimap_,
    mapLeft: mapLeft_,
}

export const MonadTask: MonadTask3<URI> = {
    URI,
    map: map_,
    of,
    ap: ap_,
    chain: chain_,
    fromIO,
    fromTask,
}

export const MonadObservable: MonadObservable3<URI> = {
    URI,
    map: map_,
    of,
    ap: ap_,
    chain: chain_,
    fromIO,
    fromObservable,
    fromTask,
}

// -------------------------------------------------------------------------------------
// destructors
// -------------------------------------------------------------------------------------

export const fetchToMutationEffectR = <
    RORK extends (...i: P) => ReaderObservableResource<R, E, A>,
    SS extends S,
    S,
    R = RORK extends (...i: any) => ReaderObservableResource<infer I, any, any> ? I : never,
    E = RORK extends (...i: any) => ReaderObservableResource<any, infer I, any> ? I : never,
    A = RORK extends (...i: any) => ReaderObservableResource<any, any, infer I> ? I : never,
    P extends Array<any> = Parameters<RORK>
>(
    mapTo: (s: SS) => (i: RES.Resource<E, A>) => S
) => (rork: RORK) => (r: R) => (...i: P) => pipe(rork(...i)(r), o => (s: SS) => o.pipe(RXoP.map(mapTo(s))))

// -------------------------------------------------------------------------------------
// utils
// -------------------------------------------------------------------------------------

export const Do: ReaderObservableResource<unknown, never, Record<string, unknown>> = of({})

export const bindTo = <K extends string, R, E, A>(
    name: K
): ((fa: ReaderObservableResource<R, E, A>) => ReaderObservableResource<R, E, { [P in K]: A }>) =>
    map(a => ({ [name]: a } as { [P in K]: A }))

export const bind = <K extends string, R, E, A, B>(
    name: Exclude<K, keyof A>,
    f: (a: A) => ReaderObservableResource<R, E, B>
): ((
    fa: ReaderObservableResource<R, E, A>
) => ReaderObservableResource<R, E, { [P in keyof A | K]: P extends keyof A ? A[P] : B }>) =>
    chain(a =>
        pipe(
            f(a),
            map(b => ({ ...a, [name]: b } as any))
        )
    )

export const bindW: <K extends string, R2, E2, A, B>(
    name: Exclude<K, keyof A>,
    f: (a: A) => ReaderObservableResource<R2, E2, B>
) => <R1, E1>(
    fa: ReaderObservableResource<R1, E1, A>
) => ReaderObservableResource<R1 & R2, E1 | E2, { [P in keyof A | K]: P extends keyof A ? A[P] : B }> = bind as any
