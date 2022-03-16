import { distinctUntilChanged } from 'rxjs/operators'
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/shim/with-selector'
import type * as MS from '../state'
import type { StoreName } from '../state/stores'

export const useSelector = <N extends StoreName, S, T>(store: MS.Store<N, S>, map: (s: S) => T): T => {
    return useSyncExternalStoreWithSelector<S, T>(
        listener => {
            const sub = store.state$.pipe(distinctUntilChanged()).subscribe(() => listener())

            return () => sub.unsubscribe()
        },
        () => store.state$.getValue(),
        () => store.initState,
        map
    )
}
