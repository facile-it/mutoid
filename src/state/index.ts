import type * as T from 'fp-ts/Task'
import { BehaviorSubject, Observable, Subscription, firstValueFrom } from 'rxjs'
import { switchMap, take, takeUntil, takeWhile, tap } from 'rxjs/operators'
import type { AllMutationName, MutationName, StoreName } from './stores'

// type

type MutationNotify<N extends StoreName, S> = Readonly<{
    state: S
    name: N
    mutationName: MutationName<N>
    payload: Array<unknown>
    date: ReturnType<Date['toISOString']>
}>

type NotifySubject<N extends StoreName, S> = Readonly<
    | { type: 'initStore'; name: N }
    | ({ type: 'mutationLoad' } & MutationNotify<N, S>)
    | ({ type: 'mutationStart' } & MutationNotify<N, S>)
    | ({ type: 'mutationEnd' } & MutationNotify<N, S>)
>

type StoreOpaque<N extends StoreName, S> = Readonly<{
    name: N
    state$: BehaviorSubject<S>
    notifier$: BehaviorSubject<NotifySubject<N, S>>
    initState: S
}>

export interface Store<N extends StoreName, S> extends StoreOpaque<N, S> {}

export type MutationEffect<P extends Array<unknown>, S, SS extends S> = (...p: P) => (state: SS) => Observable<S>

type MutationOpaque<NM, P extends Array<unknown>, S, SS extends S> = Readonly<{
    name: NM
    effect: MutationEffect<P, S, SS>
    filterPredicate?: (state: S) => state is SS
}>

export interface Mutation<NM, P extends Array<unknown>, S, SS extends S> extends MutationOpaque<NM, P, S, SS> {}

// constructor

export const ctor = <N extends StoreName, S>(c: { name: N; initState: S }): Store<N, S> => {
    return {
        name: c.name,
        state$: new BehaviorSubject<S>(c.initState),
        notifier$: new BehaviorSubject<NotifySubject<N, S>>({ type: 'initStore', name: c.name }),
        initState: c.initState,
    }
}

// mutation

export const ctorMutation = <NM extends AllMutationName, P extends Array<unknown>, S>(
    name: NM,
    effect: MutationEffect<P, S, S>
): Mutation<NM, P, S, S> => ({ name, effect })

export const ctorMutationC =
    <NM extends AllMutationName, P extends Array<unknown>, S>(name: NM) =>
    (effect: MutationEffect<P, S, S>): Mutation<NM, P, S, S> =>
        ctorMutation(name, effect)

export const ctorMutationCR =
    <NM extends AllMutationName, P extends Array<unknown>, S, R>(name: NM) =>
    (effectR: (r: R) => MutationEffect<P, S, S>): ((r: R) => Mutation<NM, P, S, S>) =>
    r =>
        ctorMutation(name, effectR(r))

// partialMutation

export const ctorPartialMutation = <NM extends AllMutationName, P extends Array<unknown>, S, SS extends S>(
    name: NM,
    filterPredicate: (s: S) => s is SS,
    effect: MutationEffect<P, S, SS>
): Mutation<NM, P, S, SS> => ({ name, filterPredicate, effect })

export const ctorPartialMutationC =
    <NM extends AllMutationName, P extends Array<unknown>, S, SS extends S>(
        name: NM,
        filterPredicate: (s: S) => s is SS
    ) =>
    (effect: MutationEffect<P, S, SS>): Mutation<NM, P, S, SS> =>
        ctorPartialMutation(name, filterPredicate, effect)

export const ctorPartialMutationCR =
    <NM extends AllMutationName, P extends Array<unknown>, S, SS extends S, R>(
        name: NM,
        filterPredicate: (s: S) => s is SS
    ) =>
    (effectR: (r: R) => MutationEffect<P, S, SS>): ((r: R) => Mutation<NM, P, S, SS>) =>
    (r: R) =>
        ctorPartialMutation(name, filterPredicate, effectR(r))

// runner

export const toTask =
    <N extends StoreName, S>(store: Store<N, S>): T.Task<S> =>
    () =>
        firstValueFrom(store.state$.pipe(take(1)))

export interface BaseOptions {
    notifierTakeUntil?: Observable<unknown>
}
export interface DepsOptions<R extends Record<string, unknown>> {
    deps: R
}

export function mutationRunner<
    N extends StoreName,
    NM extends MutationName<N>,
    P extends Array<unknown>,
    S,
    SS extends S,
    R extends Record<K, unknown>,
    K extends string
>(
    store: Store<N, S>,
    mutationR: (deps: R) => Mutation<NM, P, S, SS>,
    options: BaseOptions & DepsOptions<R>
    // no deps
): (...p: P) => Subscription
export function mutationRunner<
    N extends StoreName,
    NM extends MutationName<N>,
    P extends Array<unknown>,
    S,
    SS extends S
    // no deps overload
>(store: Store<N, S>, mutationL: () => Mutation<NM, P, S, SS>, options?: BaseOptions): (...p: P) => Subscription
export function mutationRunner<
    N extends StoreName,
    NM extends MutationName<N>,
    P extends Array<unknown>,
    S,
    SS extends S,
    R extends Record<K, unknown>,
    K extends never
>(
    store: Store<N, S>,
    mutationR: (deps?: R) => Mutation<NM, P, S, SS>,
    options?: BaseOptions & Partial<DepsOptions<R>>
): (...p: P) => Subscription {
    return (...payload) => {
        const mutation = mutationR(options?.deps)

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
                toTask(store)().then(s => store.notifier$.next({ ...baseNotify(s, new Date()), type: 'mutationEnd' })),
        })
    }
}
