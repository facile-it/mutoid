import * as E from 'fp-ts/Either'
import * as J from 'fp-ts/Json'
import * as T from 'fp-ts/Task'
import * as TO from 'fp-ts/TaskOption'
import { flow, pipe } from 'fp-ts/function'
import { cachePoolItemT } from '../io-types'
import type * as RESFF from '../resourceFetchFactory'
import type { CachePoolAdapter } from './cachePoolAdapter'

interface CachePoolWebStorageDeps {
    storage: Storage
    namespace: string
}

const namespacedKey = (namespace: string, key: string) => `${namespace}_${key}`

const deleteItemFactory = (deps: CachePoolWebStorageDeps) => (key: string): T.Task<void> => () => {
    deps.storage.removeItem(namespacedKey(deps.namespace, key))

    return Promise.resolve()
}

export const cachePoolWebStorage = (deps: CachePoolWebStorageDeps): CachePoolAdapter => {
    const deleteItem = deleteItemFactory(deps)

    return {
        deleteItem,
        clear: pipe(
            Object.keys(deps.storage)
                .filter((key: string) => key.indexOf(`${deps.namespace}_`) === 0)
                .map(k => deleteItem(k.split('_')[1] as string)),
            T.sequenceArray
        ),
        findItem: (key: string): TO.TaskOption<RESFF.CacheItem> =>
            pipe(
                deps.storage.getItem(namespacedKey(deps.namespace, key)),
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
                        v => deps.storage.setItem(namespacedKey(deps.namespace, key), v),
                        () => 'errorOnSave'
                    )
                )
            )

            return Promise.resolve()
        },
    }
}
