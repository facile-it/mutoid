import { Lazy } from 'fp-ts/lib/function'
import { useEffect, useMemo, useState } from 'react'
import { distinctUntilChanged } from 'rxjs/operators'
import * as Mutoid from '../state'

export const useSelector = <S, T>(store: Lazy<Mutoid.Store<S>>, map: (s: S) => T): T => {
    const [value, setValue] = useState<T>(() => map(store().initState))

    const state$ = store().state$

    useEffect(() => {
        const subscription = state$.pipe(distinctUntilChanged()).subscribe(s => setValue(map(s)))

        return () => {
            subscription.unsubscribe()
        }
    }, [state$, map])

    return useMemo(() => value, [value])
}
