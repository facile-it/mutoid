import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/shim/with-selector'
import type * as MS from '../state'
import type { StoreName } from '../state/stores'

export const useSelector = <N extends StoreName, S, T>(store: MS.Store<N, S>, map: (s: S) => T): T => {
    const formState = useSyncExternalStoreWithSelector(store.subscribe, store.getState, store.getState, map)

    return formState
}
