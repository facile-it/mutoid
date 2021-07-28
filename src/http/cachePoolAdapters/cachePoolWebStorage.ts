import * as E from 'fp-ts/Either'
import * as J from 'fp-ts/Json'
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

export const cachePoolWebStorage = (env: CachePoolWebStorageEnvironment): CachePoolAdapter => {
    const deleteItem = deleteItemFactory(env)

    return {
        deleteItem,
        clear: pipe(
            Object.keys(env.storage)
                .filter((key: string) => key.indexOf(`${env.namespace}_`) === 0)
                .map(k => k.slice(env.namespace.length + 1))
                .map(k => deleteItem(k)),
            T.sequenceArray
        ),
        findItem: (key: string): TO.TaskOption<RESFF.CacheItem> =>
            pipe(
                env.storage.getItem(namespacedKey(env.namespace, key)),
                TO.fromNullable,
                TO.chain(
                    flow(
                        J.parse,
                        E.chainW(cachePoolItemT.decode),
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
        addItem: (key: string, item: RESFF.CacheItem, ttl: number): T.Task<void> => () => {
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

            return Promise.resolve()
        },
    }
}
