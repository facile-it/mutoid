import memoize from 'fast-memoize'
import * as T from 'fp-ts/lib/Task'
import { Lazy } from 'fp-ts/lib/function'
import { BehaviorSubject, Observable, Subscription } from 'rxjs'
import { switchMap, take, takeUntil, takeWhile, tap } from 'rxjs/operators'

// type

interface MutationNotify<N, S> {
    state: S
    name: N
    mutationName: string
    payload: Array<unknown>
    date: ReturnType<Date['toISOString']>
}

type NotifySubject<N, S> =
    | { type: 'initStore'; name: N }
    | ({ type: 'mutationLoad' } & MutationNotify<N, S>)
    | ({ type: 'mutationStart' } & MutationNotify<N, S>)
    | ({ type: 'mutationEnd' } & MutationNotify<N, S>)

export interface Store<N extends string, S> {
    readonly name: N
    readonly state$: BehaviorSubject<S>
    readonly notifier$: BehaviorSubject<NotifySubject<N, S>>
    readonly initState: S
}

export type MutationEffect<P extends Array<unknown>, S, SS extends S> = (...p: P) => (state: SS) => Observable<S>

export interface Mutation<NM, P extends Array<unknown>, S, SS extends S> {
    name: NM
    effect: MutationEffect<P, S, SS>
    filterPredicate?: (state: S) => state is SS
}

// constructor

export const ctor = <N extends string, T>(init: Lazy<{ name: N; initState: T }>): Lazy<Store<N, T>> => {
    return memoize(() => {
        const c = init()

        return {
            name: c.name,
            state$: new BehaviorSubject<T>(c.initState),
            notifier$: new BehaviorSubject<NotifySubject<N, T>>({ type: 'initStore', name: c.name }),
            initState: c.initState,
        }
    })
}

export const ctorMutation = <NM extends string, P extends Array<unknown>, S>(
    name: NM,
    effect: MutationEffect<P, S, S>
): Mutation<NM, P, S, S> => ({ name, effect })

export const ctorPartialMutation = <NM extends string, P extends Array<unknown>, S, SS extends S>(
    name: NM,
    effect: MutationEffect<P, S, SS>,
    filterPredicate: (s: S) => s is SS
): Mutation<NM, P, S, SS> => ({ name, effect, filterPredicate })

// runner

export const toTask = <N extends string, S>(store: Lazy<Store<N, S>>): T.Task<S> => () =>
    store().state$.pipe(take(1)).toPromise()

export const mutationRunner = <N extends string, NM extends string, P extends Array<unknown>, S, SS extends S>(
    storeL: Lazy<Store<N, S>>,
    mutationL: Lazy<Mutation<NM, P, S, SS>>,
    notifierTakeUntil?: Observable<unknown>
) => (...payload: P): Subscription => {
    const store = storeL()
    const mutation = mutationL()

    const baseNotify = (state: S, date: Date) => ({
        name: store.name,
        mutationName: mutation.name,
        state: state,
        date: date.toISOString(),
        payload: payload,
    })

    const sequence = store.state$.pipe(
        take(1),
        tap(s => store.notifier$.next({ ...baseNotify(s, new Date()), type: 'mutationLoad' })),
        takeWhile((s): s is SS => (mutation.filterPredicate && mutation.filterPredicate(s)) || true),
        tap(s => store.notifier$.next({ ...baseNotify(s, new Date()), type: 'mutationStart' })),
        switchMap(s => {
            const pm = mutation.effect(...payload)

            if (notifierTakeUntil) {
                return pm(s).pipe(takeUntil(notifierTakeUntil))
            }

            return pm(s)
        })
    )

    // can't use eta reduction
    return sequence.subscribe({
        next: s => store.state$.next(s),
        complete: () =>
            toTask(storeL)().then(s => store.notifier$.next({ ...baseNotify(s, new Date()), type: 'mutationEnd' })),
    })
}
