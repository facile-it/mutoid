import * as T from 'fp-ts/lib/Task'
import { BehaviorSubject, Observable, Subscription } from 'rxjs'
import { switchMap, take, takeUntil } from 'rxjs/operators'

export type Store<T> = {
    readonly state$: BehaviorSubject<T>
    readonly defaultState: T
}

export type Mutation<P extends Array<any> = Array<unknown>, S = unknown> = (...p: P) => (state: S) => Observable<S>
export type ExtractParameters<M extends (...args: any) => (state: any) => Observable<any>> = Parameters<M>
export type ExtractState<M extends (...args: any) => (state: any) => Observable<any>> = Parameters<ReturnType<M>>[0]

export const of = <T>(defaultState: T): Store<T> => ({
    state$: new BehaviorSubject<T>(defaultState),
    defaultState: defaultState,
})

export const toTask = <S>(store: Store<S>): T.Task<S> => () => store.state$.pipe(take(1)).toPromise()

export const mutationRunner = <S, P extends Array<any>>(
    store: Store<S>,
    mutation: Mutation<P, S>,
    notifierTakeUntil?: Observable<any>
) => (...payload: P): Subscription => {
    const sequence = store.state$.pipe(
        take(1),
        switchMap(s => {
            const pm = mutation(...payload)

            if (notifierTakeUntil) {
                return pm(s).pipe(takeUntil(notifierTakeUntil))
            }

            return pm(s)
        })
    )

    // can't use eta reduction
    return sequence.subscribe(s => store.state$.next(s))
}
