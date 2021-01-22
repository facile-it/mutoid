import type { Lazy } from 'fp-ts/lib/function'
import { useRef } from 'react'
import type * as MS from '../state'
import type { storeName } from '../state/stores'

export function useStore<N extends storeName, S>(s: Lazy<MS.Store<N, S>>): Lazy<MS.Store<N, S>> {
    const store = useRef(s)

    return store.current
}
