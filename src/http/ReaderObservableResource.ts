import type { MonadObservable3 } from 'fp-ts-rxjs/lib/MonadObservable'
import type { Applicative3 } from 'fp-ts/lib/Applicative'
import type { Apply3 } from 'fp-ts/lib/Apply'
import type { Bifunctor3 } from 'fp-ts/lib/Bifunctor'
import type { Functor3 } from 'fp-ts/lib/Functor'
import type { Monad3 } from 'fp-ts/lib/Monad'
import type { MonadIO3 } from 'fp-ts/lib/MonadIO'
import type { MonadTask3 } from 'fp-ts/lib/MonadTask'
import * as R from 'fp-ts/lib/Reader'
import { flow, identity, pipe } from 'fp-ts/lib/function'
import type { Observable } from 'rxjs'
import * as RRES from './ObservableResource'

// -------------------------------------------------------------------------------------
// model
// -------------------------------------------------------------------------------------

export interface ReaderObservableResource<R, E, A> {
    (r: R): RRES.ObservableResource<E, A>
}

// -------------------------------------------------------------------------------------
// constructors
// -------------------------------------------------------------------------------------

export const fromObservableResource: <R, E, A>(ma: RRES.ObservableResource<E, A>) => ReaderObservableResource<R, E, A> =
    R.of

export const init: ReaderObservableResource<never, never, never> = () => RRES.init
export const submitted: ReaderObservableResource<never, never, never> = () => RRES.submitted

export const done: <R, E = never, A = never>(d: A) => ReaderObservableResource<R, E, A> = flow(
    RRES.done,
    fromObservableResource
)
export const doneObservable: <R, E = never, A = never>(oa: Observable<A>) => ReaderObservableResource<R, E, A> = flow(
    RRES.doneObservable,
    fromObservableResource
)

export const fail: <R, E = never, A = never>(e: E) => ReaderObservableResource<R, E, A> = flow(
    RRES.fail,
    fromObservableResource
)
export const failObservable: <R, E = never, A = never>(oe: Observable<E>) => ReaderObservableResource<R, E, A> = flow(
    RRES.failObservable,
    fromObservableResource
)

export const ask: <R, E>() => ReaderObservableResource<R, E, R> = () => RRES.done

export const asks: <R, E, A>(f: (r: R) => A) => ReaderObservableResource<R, E, A> = f => flow(RRES.done, RRES.map(f))

export const fromReader: <R, E, A>(ma: R.Reader<R, A>) => ReaderObservableResource<R, E, A> = ma => flow(ma, RRES.done)

export const fromTask: MonadTask3<URI>['fromTask'] = ma => () => RRES.fromTask(ma)

export const fromObservable: MonadObservable3<URI>['fromObservable'] = ma => () => RRES.doneObservable(ma)

export const fromIO: MonadIO3<URI>['fromIO'] = ma => () => RRES.rightIO(ma)

export const fromAjax = flow(RRES.fromAjax, fromObservableResource)

// -------------------------------------------------------------------------------------
// combinators
// -------------------------------------------------------------------------------------

export const local: <R2, R1>(
    f: (d: R2) => R1
) => <E, A>(ma: ReaderObservableResource<R1, E, A>) => ReaderObservableResource<R2, E, A> = R.local

// -------------------------------------------------------------------------------------
// type class members
// -------------------------------------------------------------------------------------

export const map: <A, B>(
    f: (a: A) => B
) => <R, E>(fa: ReaderObservableResource<R, E, A>) => ReaderObservableResource<R, E, B> = f => fa =>
    flow(fa, RRES.map(f))

export const bimap: <E, G, A, B>(
    f: (e: E) => G,
    g: (a: A) => B
) => <R>(fa: ReaderObservableResource<R, E, A>) => ReaderObservableResource<R, G, B> = (f, g) => fea => r =>
    RRES.bimap(f, g)(fea(r))

export const mapLeft: <E, G>(
    f: (e: E) => G
) => <R, A>(fa: ReaderObservableResource<R, E, A>) => ReaderObservableResource<R, G, A> = f => fea => r =>
    RRES.mapLeft(f)(fea(r))

export const ap: <R, E, A>(
    fa: ReaderObservableResource<R, E, A>
) => <B>(fab: ReaderObservableResource<R, E, (a: A) => B>) => ReaderObservableResource<R, E, B> = fa => fab => r =>
    pipe(fab(r), RRES.ap(fa(r)))

export const chainW = <A, R2, E2, B>(f: (a: A) => ReaderObservableResource<R2, E2, B>) => <R1, E1>(
    ma: ReaderObservableResource<R1, E1, A>
): ReaderObservableResource<R1 & R2, E1 | E2, B> => r =>
    pipe(
        ma(r),
        RRES.chainW(a => f(a)(r))
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
