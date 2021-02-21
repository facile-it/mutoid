import type { MonadObservable2 } from 'fp-ts-rxjs/MonadObservable'
import * as R from 'fp-ts-rxjs/Observable'
import type { ObservableEither } from 'fp-ts-rxjs/lib/ObservableEither'
import type { Applicative2 } from 'fp-ts/Applicative'
import type { Apply2 } from 'fp-ts/Apply'
import type { Bifunctor2 } from 'fp-ts/Bifunctor'
import * as E from 'fp-ts/Either'
import type { Functor2 } from 'fp-ts/Functor'
import type { IO } from 'fp-ts/IO'
import type { Monad2 } from 'fp-ts/Monad'
import type { MonadIO2 } from 'fp-ts/MonadIO'
import type { MonadTask2 } from 'fp-ts/MonadTask'
import type * as T from 'fp-ts/Task'
import { flow, identity, Predicate, Refinement } from 'fp-ts/function'
import { pipe } from 'fp-ts/pipeable'
import { Observable, concat } from 'rxjs'
import type { AjaxError, AjaxResponse } from 'rxjs/ajax'
// eslint-disable-next-line rxjs/no-internal
import type { AjaxErrorNames } from 'rxjs/internal/observable/dom/AjaxObservable'
import * as RXoP from 'rxjs/operators'
import * as RES from './Resource'
import type { StatusCode } from './statusCode'

// -------------------------------------------------------------------------------------
// model
// -------------------------------------------------------------------------------------

export type ObservableResource<E, A> = Observable<RES.Resource<E, A>>

export type ObservableResourceTypeOf<DS extends RES.ResourceDecoders, AE = never> = Observable<
    RES.ResourceTypeOf<DS, AE>
>

// -------------------------------------------------------------------------------------
// constructors
// -------------------------------------------------------------------------------------

export const init: ObservableResource<never, never> = R.of(RES.init)
export const submitted: ObservableResource<never, never> = R.of(RES.submitted)

export const done: <E = never, A = never>(d: A) => ObservableResource<E, A> = flow(RES.done, R.of)
export const doneObservable: <E = never, A = never>(oa: Observable<A>) => ObservableResource<E, A> = R.map(RES.done)

export const fail: <E = never, A = never>(e: E) => ObservableResource<E, A> = flow(RES.fail, R.of)
export const failObservable: <E = never, A = never>(oe: Observable<E>) => ObservableResource<E, A> = R.map(RES.fail)

// TODO maybe wrong
export const failAppError: <AE = never, A = never>(ae: AE) => ObservableResource<RES.ResourceAjaxError<AE>, A> = flow(
    RES.failAppError,
    R.of
)

export const ajaxFail: <AE = never, A = never>(
    e: RES.ResourceAjaxError<AE>
) => ObservableResource<RES.ResourceAjaxError<AE>, A> = flow(RES.ajaxFail, R.of)

export const ajaxFailObservable: <AE = never, A = never>(
    e: Observable<RES.ResourceAjaxError<AE>>
) => ObservableResource<RES.ResourceAjaxError<AE>, A> = R.map(RES.ajaxFail)

export type ObservableAjax<AE = never> = Observable<AjaxResponse | RES.ResourceAjaxFail<AE>>

export const fromAjax = <DS extends RES.ResourceDecoders, AE = never>(
    ajax$: ObservableAjax<AE>,
    decoders: DS
): ObservableResourceTypeOf<DS, AE> =>
    concat(
        submitted,
        ajax$.pipe(
            RXoP.map(decodeResponse(decoders)),
            RXoP.catchError(
                (e: unknown): Observable<RES.ResourceTypeOfAcknowledged<DS, AE>> =>
                    R.of(
                        isAjaxError(e)
                            ? decodeResponse(decoders)(e)
                            : (RES.fail({ type: 'unknownError', detail: e }) as RES.ResourceTypeOfFail<DS, AE>)
                    )
            )
        )
    ).pipe(RXoP.take(2))

// aggiungere submitted ?
export const fromTaskResource: <E, A>(t: T.Task<RES.Resource<E, A>>) => ObservableResource<E, A> = R.fromTask

// aggiungere submitted ?
export const fromTask: MonadTask2<URI>['fromTask'] = flow(R.fromTask, doneObservable)

export const rightIO: <E = never, A = never>(ma: IO<A>) => ObservableResource<E, A> = flow(R.fromIO, doneObservable)

export const fromIO: MonadIO2<URI>['fromIO'] = rightIO

export const fromObservable: MonadObservable2<URI>['fromObservable'] = doneObservable

export const fromEither: <E, A>(e: E.Either<E, A>) => ObservableResource<E, A> = flow(RES.fromEither, R.of)

export const fromObservableEither = <E, A>(oe: ObservableEither<E, A>): ObservableResource<E, A> =>
    oe.pipe(RXoP.map(RES.fromEither))

// -------------------------------------------------------------------------------------
// destructors
// -------------------------------------------------------------------------------------

export const match: <E, A, R>(
    onInit: () => Observable<R>,
    onSubmitted: () => Observable<R>,
    onDone: (r: A) => Observable<R>,
    onFail: (r: E) => Observable<R>
) => (ma: ObservableResource<E, A>) => Observable<R> = flow(RES.match, R.chain)

export const fetchToMutationEffect = <
    AX extends (...i: I) => Observable<R>,
    SS extends S,
    S,
    I extends Array<any> = Parameters<AX>,
    R = AX extends (...args: any) => Observable<infer R> ? R : never
>(
    mapTo: (s: SS) => (i: R) => S
) => (ax: AX) => flow(ax, o => (s: SS) => o.pipe(RXoP.map(mapTo(s))))

// -------------------------------------------------------------------------------------
// combinators
// -------------------------------------------------------------------------------------

export const orElse: <E, A, M>(
    onFail: (e: E) => ObservableResource<M, A>
) => (ma: ObservableResource<E, A>) => ObservableResource<M, A> = f =>
    R.chain(
        RES.match(
            () => init,
            () => submitted,
            done,
            f
        )
    )

export const filterOrElseW: {
    <A, B extends A, E2>(refinement: Refinement<A, B>, onFalse: (a: A) => E2): <E1>(
        ma: ObservableResource<E1, A>
    ) => ObservableResource<E1 | E2, B>
    <A, E2>(predicate: Predicate<A>, onFalse: (a: A) => E2): <E1>(
        ma: ObservableResource<E1, A>
    ) => ObservableResource<E1 | E2, A>
} = <A, E2>(
    predicate: Predicate<A>,
    onFalse: (a: A) => E2
): (<E1>(ma: ObservableResource<E1, A>) => ObservableResource<E1 | E2, A>) =>
    chainW(a => (predicate(a) ? done(a) : fail(onFalse(a))))

export const filterOrElse: {
    <E, A, B extends A>(refinement: Refinement<A, B>, onFalse: (a: A) => E): (
        ma: ObservableResource<E, A>
    ) => ObservableResource<E, B>
    <E, A>(predicate: Predicate<A>, onFalse: (a: A) => E): (ma: ObservableResource<E, A>) => ObservableResource<E, A>
} = filterOrElseW

// -------------------------------------------------------------------------------------
// type class members
// -------------------------------------------------------------------------------------

export const map: <A, B>(f: (a: A) => B) => <E>(fa: ObservableResource<E, A>) => ObservableResource<E, B> = f =>
    R.map(RES.map(f))

export const bimap: <E, G, A, B>(
    f: (e: E) => G,
    g: (a: A) => B
) => (fa: ObservableResource<E, A>) => ObservableResource<G, B> = flow(RES.bimap, R.map)

export const mapLeft: <E, G>(f: (e: E) => G) => <A>(fa: ObservableResource<E, A>) => ObservableResource<G, A> = f =>
    R.map(RES.mapLeft(f))

export const ap = <E, A>(
    fa: ObservableResource<E, A>
): (<B>(fab: ObservableResource<E, (a: A) => B>) => ObservableResource<E, B>) =>
    flow(
        R.map(gab => (ga: RES.Resource<E, A>) => RES.ap(ga)(gab)),
        R.ap(fa)
    )

export const chainW = <A, E2, B>(f: (a: A) => ObservableResource<E2, B>) => <E1>(
    ma: ObservableResource<E1, A>
): ObservableResource<E1 | E2, B> =>
    pipe(
        ma,
        R.chain(
            RES.match(
                () => init,
                () => submitted,
                f,
                e => fail<E1 | E2, B>(e)
            )
        )
    )

export const chain: <A, E, B>(
    f: (a: A) => ObservableResource<E, B>
) => (ma: ObservableResource<E, A>) => ObservableResource<E, B> = chainW

export const flatten: <E, A>(mma: ObservableResource<E, ObservableResource<E, A>>) => ObservableResource<E, A> = chain(
    identity
)

export const of: Applicative2<URI>['of'] = done

// -------------------------------------------------------------------------------------
// instances
// -------------------------------------------------------------------------------------

/* istanbul ignore next */
const map_: Functor2<URI>['map'] = (fa, f) => pipe(fa, map(f))
/* istanbul ignore next */
const bimap_: Bifunctor2<URI>['bimap'] = (fea, f, g) => pipe(fea, bimap(f, g))
/* istanbul ignore next */
const mapLeft_: Bifunctor2<URI>['mapLeft'] = (fea, f) => pipe(fea, mapLeft(f))
/* istanbul ignore next */
const ap_: Apply2<URI>['ap'] = (fab, fa) => pipe(fab, ap(fa))
/* istanbul ignore next */
const chain_: Monad2<URI>['chain'] = (ma, f) => pipe(ma, chain(f))

export const URI = 'ObservableResource'

export type URI = typeof URI

declare module 'fp-ts/HKT' {
    interface URItoKind2<E, A> {
        readonly [URI]: ObservableResource<E, A>
    }
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

export const MonadObservable: MonadObservable2<URI> = {
    URI,
    map: map_,
    ap: ap_,
    of,
    chain: chain_,
    fromIO,
    fromTask,
    fromObservable,
}

export const observableResource: Monad2<URI> & Bifunctor2<URI> & MonadObservable2<URI> = {
    URI,
    map: map_,
    of,
    ap: ap_,
    chain: chain_,
    bimap: bimap_,
    mapLeft: mapLeft_,
    fromIO: rightIO,
    fromTask,
    fromObservable,
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
