import * as t from 'io-ts'
import { cacheItemT } from './cacheItemT'

export const cachePoolItemT = t.interface(
    {
        validUntil: t.number,
        item: cacheItemT,
    },
    'CachePoolItem'
)
