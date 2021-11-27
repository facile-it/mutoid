import * as E from 'fp-ts/Either'
import * as J from 'fp-ts/Json'
import * as O from 'fp-ts/Option'
import * as T from 'fp-ts/Task'
import * as TO from 'fp-ts/TaskOption'
import { flow, pipe } from 'fp-ts/function'
import { cachePoolItemT } from '../io-types'
import type * as RESFF from '../resourceFetchFactory'
import type { CachePoolAdapter } from '.'

export interface CachePoolWebStorageEnvironment {
    storage: Storage
    namespace: string
}

const namespacedKey = (namespace: string, key: string) => `${namespace}_${key}`

const deleteItemFactory = (env: CachePoolWebStorageEnvironment) => (key: string): T.Task<void> => () => {
    env.storage.removeItem(namespacedKey(env.namespace, key))

    return Promise.resolve()
}

const deleteItemFactoryS = (env: CachePoolWebStorageEnvironment) => (key: string) => {
    env.storage.removeItem(namespacedKey(env.namespace, key))
}

export const cachePoolWebStorage = (env: CachePoolWebStorageEnvironment): CachePoolAdapter => {
    const deleteItem = deleteItemFactory(env)
    const deleteItemS = deleteItemFactoryS(env)

    const filterStorageItemPerNamespace = () =>
        Object.keys(env.storage)
            .filter((key: string) => key.indexOf(`${env.namespace}_`) === 0)
            .map(k => k.slice(env.namespace.length + 1))

    const doAddItem = (key: string, item: RESFF.CacheItem, ttl: number) => {
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
    }

    const decodeCacheItem = flow(J.parse, E.chainW(cachePoolItemT.decode))

    return {
        deleteItem,
        deleteItemS,
        clear: pipe(
            filterStorageItemPerNamespace().map(k => deleteItem(k)),
            T.sequenceArray
        ),
        clearS: () => filterStorageItemPerNamespace().map(k => deleteItemS(k)),
        findItem: (key: string): TO.TaskOption<RESFF.CacheItem> =>
            pipe(
                env.storage.getItem(namespacedKey(env.namespace, key)),
                TO.fromNullable,
                TO.chain(
                    flow(
                        decodeCacheItem,
                        TO.fromEither,
                        TO.filter(id => id.validUntil >= new Date().getTime()),
                        TO.map(id => id.item),
                        TO.altW(() =>
                            pipe(
                                deleteItem(key),
                                TO.fromTask,
                                TO.chain(() => TO.none)
                            )
                        )
                    )
                )
            ),
        findItemS: (key: string): O.Option<RESFF.CacheItem> =>
            pipe(
                O.fromNullable(env.storage.getItem(namespacedKey(env.namespace, key))),
                O.chain(
                    flow(
                        decodeCacheItem,
                        O.fromEither,
                        O.filter(id => id.validUntil >= new Date().getTime()),
                        O.map(id => id.item),
                        O.altW(() => {
                            deleteItemS(key)
                            return O.none
                        })
                    )
                )
            ),
        addItem: (key: string, item: RESFF.CacheItem, ttl: number): T.Task<void> => () => {
            doAddItem(key, item, ttl)

            return Promise.resolve()
        },
        addItemS: (key: string, item: RESFF.CacheItem, ttl: number) => {
            doAddItem(key, item, ttl)
        },
    }
}
