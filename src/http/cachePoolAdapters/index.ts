import type * as T from 'fp-ts/Task'
import type * as t from 'io-ts'
import type { cachePoolItemT } from '../io-types'
import type * as RESFF from '../resourceFetchFactory'

export interface CachePoolAdapter extends RESFF.CachePool {
    deleteItem: (key: string) => T.Task<void>
    clear: T.Task<void | readonly void[]>
}

export type CachePoolItem = t.TypeOf<typeof cachePoolItemT>

export * from './cachePoolWebStorage'
