import memoize from 'fast-memoize'
import type * as T from 'fp-ts/Task'
import type { Lazy } from 'fp-ts/function'
import { BehaviorSubject, Observable, Subscription } from 'rxjs'
import { switchMap, take, takeUntil, takeWhile, tap } from 'rxjs/operators'

// type

type MutationNotify<N, S> = Readonly<{
    state: S
    name: N
    mutationName: string
    payload: Array<unknown>
    date: ReturnType<Date['toISOString']>
}>

type NotifySubject<N, S> = Readonly<
    | { type: 'initStore'; name: N }
    | ({ type: 'mutationLoad' } & MutationNotify<N, S>)
    | ({ type: 'mutationStart' } & MutationNotify<N, S>)
    | ({ type: 'mutationEnd' } & MutationNotify<N, S>)
>

export type Store<N extends string, S> = Readonly<{
    name: N
    state$: BehaviorSubject<S>
    notifier$: BehaviorSubject<NotifySubject<N, S>>
    initState: S
}>

export type MutationEffect<P extends Array<unknown>, S, SS extends S> = (...p: P) => (state: SS) => Observable<S>

export type Mutation<NM, P extends Array<unknown>, S, SS extends S> = Readonly<{
    name: NM
    effect: MutationEffect<P, S, SS>
    filterPredicate?: (state: S) => state is SS
}>

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
    filterPredicate: (s: S) => s is SS,
    effect: MutationEffect<P, S, SS>
): Mutation<NM, P, S, SS> => ({ name, filterPredicate, effect })

// runner

export const toTask = <N extends string, S>(store: Lazy<Store<N, S>>): T.Task<S> => () =>
    store().state$.pipe(take(1)).toPromise()

export interface BaseOptions {
    notifierTakeUntil?: Observable<unknown>
}
export interface DepsOptions<D extends Record<string, unknown>> {
    deps: D
}

export function mutationRunner<
    N extends string,
    NM extends string,
    P extends Array<unknown>,
    S,
    SS extends S,
    D extends Record<K, unknown>,
    K extends string
>(
    storeL: Lazy<Store<N, S>>,
    mutationL: (deps: D) => Mutation<NM, P, S, SS>,
    options: BaseOptions & DepsOptions<D>
    // no deps
): (...p: P) => Subscription
export function mutationRunner<
    N extends string,
    NM extends string,
    P extends Array<unknown>,
    S,
    SS extends S,
    D extends Record<never, unknown>
    // no deps overload
>(storeL: Lazy<Store<N, S>>, mutationL: () => Mutation<NM, P, S, SS>, options?: BaseOptions): (...p: P) => Subscription
export function mutationRunner<
    N extends string,
    NM extends string,
    P extends Array<unknown>,
    S,
    SS extends S,
    D extends Record<K, unknown>,
    K extends never
>(
    storeL: Lazy<Store<N, S>>,
    mutationL: (deps?: D) => Mutation<NM, P, S, SS>,
    options?: BaseOptions & Partial<DepsOptions<D>>
): (...p: P) => Subscription {
    return (...payload) => {
        const store = storeL()
        const mutation = mutationL(options?.deps)

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
            takeWhile((s): s is SS => {
                if (mutation.filterPredicate) {
                    return mutation.filterPredicate(s)
                }

                return true
            }),
            tap(s => store.notifier$.next({ ...baseNotify(s, new Date()), type: 'mutationStart' })),
            switchMap(s => {
                const pm = mutation.effect(...payload)

                if (options?.notifierTakeUntil) {
                    return pm(s).pipe(takeUntil(options.notifierTakeUntil))
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
}
