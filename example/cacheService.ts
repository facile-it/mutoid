import * as E from 'fp-ts/Either'
import type * as IO from 'fp-ts/IO'
import * as J from 'fp-ts/Json'
import * as TO from 'fp-ts/TaskOption'
import { flow, pipe } from 'fp-ts/function'
import * as t from 'io-ts'
import { cacheItemT } from '../src/http/io-types'
import type * as RESFF from '../src/http/resourceFetchFactory'

const appCacheItem = t.interface(
    {
        validUntil: t.number,
        item: cacheItemT,
    },
    'appCacheItem'
)

const cacheDeleteItem = (storage: Storage) => (key: string): IO.IO<void> => () => {
    storage.removeItem(key)
}

export const cacheService = (storage: Storage): RESFF.CacheService => ({
    findItem: (key: string): TO.TaskOption<RESFF.CacheItem> =>
        pipe(
            storage.getItem(key),
            TO.fromNullable,
            TO.chain(
                flow(
                    J.parse,
                    E.chainW(appCacheItem.decode),
                    TO.fromEither,
                    TO.filter(id => id.validUntil >= new Date().getTime()),
                    TO.map(id => id.item),
                    TO.altW(flow(cacheDeleteItem(storage)(key), () => TO.none))
                )
            )
        ),
    saveItem: (key: string, item: RESFF.CacheItem, ttl: number): IO.IO<void> => () =>
        storage.setItem(
            key,
            JSON.stringify(
                appCacheItem.encode({
                    validUntil: new Date().getTime() + ttl * 1000,
                    item,
                })
            )
        ),
})
