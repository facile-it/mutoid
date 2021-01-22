import type { Lazy } from 'fp-ts/function'
import { useCallback, useEffect, useRef } from 'react'
import type { Subscription } from 'rxjs'
import * as MS from '../state'
import type { mutationName, storeName } from '../state/stores'

export function useMutation<
    N extends storeName,
    NM extends mutationName<N>,
    P extends Array<unknown>,
    S,
    SS extends S,
    D extends Record<K, unknown>,
    K extends never
>(
    s: Lazy<MS.Store<N, S>>,
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
    s: Lazy<MS.Store<N, S>>,
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
    s: Lazy<MS.Store<N, S>>,
    mutationL: (deps?: D) => MS.Mutation<NM, P, S, SS>,
    options?: MS.BaseOptions & Partial<MS.DepsOptions<D>>
): (...payload: P) => Subscription {
    const optionsRef = useRef(options)

    useEffect(() => {
        optionsRef.current = options
    })

    // can't eta reduction
    return useCallback((...payload) => MS.mutationRunner(s, mutationL, optionsRef.current)(...payload), [s, mutationL])
}
