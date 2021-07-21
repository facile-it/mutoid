import type * as IO from 'fp-ts/IO'
import type * as t from 'io-ts'
import type { cachePoolItemT } from '../io-types'
import type * as RESFF from '../resourceFetchFactory'

export interface CachePoolAdapter extends RESFF.CachePool {
    deleteItem: (key: string) => IO.IO<void>
    clear: IO.IO<void>
}

export type CachePoolItem = t.TypeOf<typeof cachePoolItemT>
