import { distinctUntilChanged } from 'rxjs/operators'
import { useSyncExternalStore } from 'use-sync-external-store/shim'
import type * as MS from '../state'
import type { StoreName } from '../state/stores'

export const useSelector = <N extends StoreName, S, T>(store: MS.Store<N, S>, map: (s: S) => T): T => {
    return useSyncExternalStore<T>(
        listener => {
            const sub = store.state$.pipe(distinctUntilChanged()).subscribe(() => listener())

            return () => sub.unsubscribe()
        },
        () => map(store.state$.getValue()),
        () => map(store.initState)
    )
}
