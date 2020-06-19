import * as Mutoid from '../state'
import { distinctUntilChanged } from 'rxjs/operators'
import { useEffect, useMemo, useState } from 'react'

export const useSelector = <S, T>(s: Mutoid.Store<S>, map: (s: S) => T): T => {
    const [value, setValue] = useState<T>(map(s.defaultState))

    useEffect(() => {
        const subscription = s.state$.pipe(distinctUntilChanged()).subscribe(s => setValue(map(s)))

        return () => {
            subscription.unsubscribe()
        }
    }, [s.state$, map])

    return useMemo(() => value, [value])
}
