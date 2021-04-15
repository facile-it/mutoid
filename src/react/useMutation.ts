import { useCallback, useEffect, useRef } from 'react'
import type { Subscription } from 'rxjs'
import * as MS from '../state'
import type { mutationName, storeName } from '../state/stores'
import { useSubscriptionRef } from './useSubscriptionRef'

export function useMutation<
    N extends storeName,
    NM extends mutationName<N>,
    P extends Array<unknown>,
    S,
    SS extends S,
    D extends Record<K, unknown>,
    K extends never
>(
    s: MS.Store<N, S>,
    mutationL: (deps: D) => MS.Mutation<NM, P, S, SS>,
    options: MS.BaseOptions & MS.DepsOptions<D>
): (...payload: P) => Subscription
export function useMutation<
    N extends storeName,
    NM extends mutationName<N>,
    P extends Array<unknown>,
    S,
    SS extends S,
    D extends Record<never, unknown>
>(
    s: MS.Store<N, S>,
    mutationL: () => MS.Mutation<NM, P, S, SS>,
    options?: MS.BaseOptions
): (...payload: P) => Subscription
export function useMutation<
    N extends storeName,
    NM extends mutationName<N>,
    P extends Array<unknown>,
    S,
    SS extends S,
    D extends Record<K, unknown>,
    K extends never
>(
    s: MS.Store<N, S>,
    mutationL: (deps?: D) => MS.Mutation<NM, P, S, SS>,
    options?: MS.BaseOptions & Partial<MS.DepsOptions<D>>
): (...payload: P) => Subscription {
    const [subscriptionRef, subscriptionUnsubscribe] = useSubscriptionRef()

    const optionsRef = useRef(options)
    useEffect(() => {
        optionsRef.current = options
    }, [options])

    return useCallback(
        (...payload) => {
            subscriptionUnsubscribe()

            subscriptionRef.current = MS.mutationRunner(s, mutationL, optionsRef.current)(...payload)

            return subscriptionRef.current
        },
        [s, mutationL, subscriptionRef, subscriptionUnsubscribe]
    )
}
