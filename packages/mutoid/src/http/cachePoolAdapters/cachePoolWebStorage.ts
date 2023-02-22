import * as E from 'fp-ts/Either'
import * as IO from 'fp-ts/IO'
import * as J from 'fp-ts/Json'
import * as O from 'fp-ts/Option'
import { flow, pipe } from 'fp-ts/function'
import { cachePoolItemT } from '../io-types'
import type * as RESFF from '../resourceFetchFactory'
import type { CachePoolAdapterSync } from '.'

export interface CachePoolWebStorageEnvironment {
    storage: Storage
    namespace: string
}

const namespacedKey = (namespace: string, key: string) => `${namespace}_${key}`

const deleteItemFactory =
    (env: CachePoolWebStorageEnvironment) =>
    (key: string): IO.IO<void> =>
    () => {
        env.storage.removeItem(namespacedKey(env.namespace, key))
    }

export const cachePoolWebStorage = (env: CachePoolWebStorageEnvironment): CachePoolAdapterSync => {
    const deleteItem = deleteItemFactory(env)

    return {
        _tag: 'sync',
        deleteItem,
        clear: () =>
            pipe(
                Object.keys(env.storage)
                    .filter((key: string) => key.indexOf(`${env.namespace}_`) === 0)
                    .map(k => k.slice(env.namespace.length + 1))
                    .map(k => deleteItem(k)),
                IO.sequenceArray
            ),
        findItem: (key: string): IO.IO<O.Option<RESFF.CacheItem>> => {
            return () =>
                pipe(
                    env.storage.getItem(namespacedKey(env.namespace, key)),
                    O.fromNullable,
                    O.chain(
                        flow(
                            J.parse,
                            E.chainW(cachePoolItemT.decode),
                            O.fromEither,
                            O.filter(id => id.validUntil >= new Date().getTime()),
                            O.map(id => id.item),
                            O.altW(() => {
                                deleteItem(key)()

                                return O.none
                            })
                        )
                    )
                )
        },
        addItem:
            (key: string, item: RESFF.CacheItem, ttl: number): IO.IO<void> =>
            () => {
                pipe(
                    cachePoolItemT.encode({
                        validUntil: new Date().getTime() + ttl * 1000,
                        item,
                    }),
                    J.stringify,
                    E.mapLeft(() => 'errorOnStringify'),
                    E.chain(
                        E.tryCatchK(
                            v => env.storage.setItem(namespacedKey(env.namespace, key), v),
                            () => 'errorOnSave'
                        )
                    )
                )
            },
    }
}
