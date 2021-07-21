import * as E from 'fp-ts/Either'
import type * as IO from 'fp-ts/IO'
import * as J from 'fp-ts/Json'
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

const deleteItemFactory = (deps: CachePoolWebStorageDeps) => (key: string): IO.IO<void> => () => {
    deps.storage.removeItem(namespacedKey(deps.namespace, key))
}

export const cachePoolWebStorage = (deps: CachePoolWebStorageDeps): CachePoolAdapter => {
    const deleteItem = deleteItemFactory(deps)

    return {
        deleteItem,
        clear: () => {
            Object.keys(deps.storage)
                .filter((key: string) => key.indexOf(`${deps.namespace}_`) === 0)
                .forEach(k => deleteItem(k)())
        },
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
                        TO.altW(flow(deleteItem(key), () => TO.none))
                    )
                )
            ),
        addItem: (key: string, item: RESFF.CacheItem, ttl: number): IO.IO<void> => () =>
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
            ),
    }
}
