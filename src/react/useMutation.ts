import type { Lazy } from 'fp-ts/lib/function'
import { useCallback, useRef } from 'react'
import type { Subscription } from 'rxjs'
import * as MS from '../state'

export function useMutation<
    N extends string,
    NM extends string,
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
    N extends string,
    NM extends string,
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
    N extends string,
    NM extends string,
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
    const optionsR = useRef(options)
    // can't eta reduction
    return useCallback((...payload) => MS.mutationRunner(s, mutationL, optionsR.current)(...payload), [s, mutationL])
}
