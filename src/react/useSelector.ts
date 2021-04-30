import { useEffect, useMemo, useState } from 'react'
import { distinctUntilChanged } from 'rxjs/operators'
import type * as Mutoid from '../state'
import type { StoreName } from '../state/stores'

export const useSelector = <N extends StoreName, S, T>(store: Mutoid.Store<N, S>, map: (s: S) => T): T => {
    const [value, setValue] = useState<T>(() => map(store.initState))

    const state$ = store.state$

    useEffect(() => {
        const subscription = state$.pipe(distinctUntilChanged()).subscribe(s => setValue(map(s)))

        return () => {
            subscription.unsubscribe()
        }
    }, [state$, map])

    return useMemo(() => value, [value])
}
