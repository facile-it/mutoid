import memoize from 'fast-memoize'
import * as T from 'fp-ts/lib/Task'
import { Lazy } from 'fp-ts/lib/function'
import { BehaviorSubject, Observable, Subscription } from 'rxjs'
import { switchMap, take, takeUntil } from 'rxjs/operators'

export interface Store<T> {
    readonly name: string
    readonly state$: BehaviorSubject<T>
    readonly initState: T
}

export type Mutation<P extends Array<unknown> = Array<unknown>, S = unknown> = (...p: P) => (state: S) => Observable<S>
//export type ExtractParameters<M extends (...args: any) => (state: any) => Observable<any>> = Parameters<M>
//export type ExtractState<M extends (...args: any) => (state: any) => Observable<any>> = Parameters<ReturnType<M>>[0]

export const test = memoize(() => 1)

export const of = <T>(init: Lazy<{ name: string; initState: T }>): Lazy<Store<T>> => {
    return memoize(() => {
        const c = init()

        return {
            name: c.name,
            state$: new BehaviorSubject<T>(c.initState),
            initState: c.initState,
        }
    })
}

export const toTask = <S>(store: Lazy<Store<S>>): T.Task<S> => () => store().state$.pipe(take(1)).toPromise()

// mutator
export const mutationRunner = <S, P extends Array<T>, T>(
    store: Lazy<Store<S>>,
    mutation: Mutation<P, S>,
    notifierTakeUntil?: Observable<unknown>
) => (...payload: P): Subscription => {
    const sequence = store().state$.pipe(
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
    return sequence.subscribe(s => store().state$.next(s))
}
