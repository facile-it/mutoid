import type { Lazy } from 'fp-ts/function'
import { MutableRefObject, useRef } from 'react'
import type * as MS from '../state'
import type { storeName } from '../state/stores'

const useLazyRef = <T>(initialValFunc: () => T): MutableRefObject<T> => {
    const ref: MutableRefObject<T | null> = useRef(null)

    if (ref.current === null) {
        ref.current = initialValFunc()
    }

    return ref as MutableRefObject<T>
}

export function useStore<N extends storeName, S>(s: Lazy<MS.Store<N, S>>): MS.Store<N, S> {
    const store = useLazyRef(s)

    return store.current
}
