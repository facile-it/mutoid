import memoize from 'fast-memoize'
import * as T from 'fp-ts/lib/Task'
import { Lazy } from 'fp-ts/lib/function'
import { BehaviorSubject, Observable, Subscription } from 'rxjs'
import { switchMap, take, takeUntil, takeWhile } from 'rxjs/operators'

// type

export interface Store<T> {
    readonly name: string
    readonly state$: BehaviorSubject<T>
    readonly initState: T
}

export type MutationEffect<P extends Array<unknown>, S, SS extends S> = (...p: P) => (state: SS) => Observable<S>

export interface Mutation<N, P extends Array<unknown>, S, SS extends S> {
    name: N
    effect: MutationEffect<P, S, SS>
    predicate?: (state: S) => state is SS
}

// constructor

export const ctor = <T>(init: Lazy<{ name: string; initState: T }>): Lazy<Store<T>> => {
    return memoize(() => {
        const c = init()

        return {
            name: c.name,
            state$: new BehaviorSubject<T>(c.initState),
            initState: c.initState,
        }
    })
}

export const ctorMutation = <N extends string, P extends Array<unknown>, S>(
    name: N,
    effect: MutationEffect<P, S, S>
): Mutation<N, P, S, S> => ({ name, effect })

export const ctorPartialMutation = <N extends string, P extends Array<unknown>, S, SS extends S>(
    name: N,
    effect: MutationEffect<P, S, SS>,
    predicate: (s: S) => s is SS
): Mutation<N, P, S, SS> => ({ name, effect, predicate })

// runner

export const toTask = <S>(store: Lazy<Store<S>>): T.Task<S> => () => store().state$.pipe(take(1)).toPromise()

export const mutationRunner = <N, P extends Array<unknown>, S, SS extends S>(
    store: Lazy<Store<S>>,
    mutationL: Lazy<Mutation<N, P, S, SS>>,
    notifierTakeUntil?: Observable<unknown>
) => (...payload: P): Subscription => {
    const mutation = mutationL()

    const sequence = store().state$.pipe(
        take(1),
        takeWhile((s): s is SS => (mutation.predicate && mutation.predicate(s)) || true),
        switchMap(s => {
            const pm = mutation.effect(...payload)

            if (notifierTakeUntil) {
                return pm(s).pipe(takeUntil(notifierTakeUntil))
            }

            return pm(s)
        })
    )

    // can't use eta reduction
    return sequence.subscribe(s => store().state$.next(s))
}
