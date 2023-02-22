/* istanbul ignore file */

import type * as IO from 'fp-ts/IO'
import type * as T from 'fp-ts/Task'
import type * as t from 'io-ts'
import type { cachePoolItemT } from '../io-types'
import type * as RESFF from '../resourceFetchFactory'

export type CachePoolAdapter = CachePoolAdapterSync | CachePoolAdapterAsync

export interface CachePoolAdapterSync extends RESFF.CachePoolSync {
    deleteItem: (key: string) => IO.IO<void>
    clear: () => IO.IO<void | readonly void[]>
}

export interface CachePoolAdapterAsync extends RESFF.CachePoolAsync {
    deleteItem: (key: string) => T.Task<void>
    clear: () => T.Task<void | readonly void[]>
}

export type CachePoolItem = t.TypeOf<typeof cachePoolItemT>

export * from './cachePoolWebStorage'
