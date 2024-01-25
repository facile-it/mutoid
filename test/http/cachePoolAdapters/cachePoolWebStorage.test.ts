import { none, some } from 'fp-ts/Option'
import { cachePoolWebStorage } from '../../../src/http/cachePoolAdapters/cachePoolWebStorage'
import { MockWebStorage } from '../../_mock/MockWebStorage'

describe('cachePoolWebStorage', () => {
    const systemTime = new Date('2021-01-01').getTime()

    test('deleteItem', () => {
        const storage = new MockWebStorage()

        storage.setItem('deleteItem_hei', 'hei')
        storage.setItem('deleteItem_hei2', 'hei2')

        const pool = cachePoolWebStorage({
            storage: storage,
            namespace: 'deleteItem',
        })

        expect(storage.length).toBe(2)

        pool.deleteItem('hei')()

        expect(storage.length).toBe(1)
        expect(storage.getItem('deleteItem_hei')).toBeNull()
        expect(storage.getItem('deleteItem_hei2')).not.toBeNull()
    })

    test('clear', () => {
        const storage = new MockWebStorage()

        storage.setItem('notDeleted', 'hei')
        storage.setItem('clear_hei', 'hei')
        storage.setItem('clear_hei2', 'hei2')

        const pool = cachePoolWebStorage({
            storage: storage,
            namespace: 'clear',
        })

        expect(storage.length).toBe(3)

        pool.clear()()

        expect(storage.length).toBe(1)
        expect(storage.getItem('clear_hei')).toBeNull()
        expect(storage.getItem('notDeleted')).not.toBeNull()
    })

    test('findItem', () => {
        const storage = new MockWebStorage()

        jest.useFakeTimers().setSystemTime(systemTime)

        storage.setItem(
            'findItem_good',
            JSON.stringify({
                validUntil: systemTime + 20 * 1000,
                item: {
                    status: 200,
                    payload: 'hei',
                },
            })
        )
        storage.setItem(
            'findItem_notValid',
            JSON.stringify({
                validUntil: 2,
                item: {
                    status: 200,
                    payload: 'hei',
                },
            })
        )
        storage.setItem('findItem_bad', 'hei2')

        const pool = cachePoolWebStorage({
            storage: storage,
            namespace: 'findItem',
        })

        expect(storage.length).toBe(3)

        const itemGood = pool.findItem('good')()
        const itemNotValid = pool.findItem('notValid')()
        const itemBad = pool.findItem('bad')()

        expect(storage.length).toBe(1)
        expect(itemGood).toStrictEqual(some({ status: 200, payload: 'hei' }))
        expect(itemNotValid).toStrictEqual(none)
        expect(itemBad).toStrictEqual(none)
    })

    test('addItem', () => {
        const storage = new MockWebStorage()
        const pool = cachePoolWebStorage({
            storage: storage,
            namespace: 'addItem',
        })

        jest.useFakeTimers().setSystemTime(systemTime)

        pool.addItem(
            'hei',
            {
                status: 200,
                payload: 'hei',
            },
            3
        )()

        expect(storage.length).toBe(1)
        expect(JSON.parse(storage.getItem('addItem_hei') ?? '{}')).toStrictEqual({
            validUntil: systemTime + 3 * 1000,
            item: {
                status: 200,
                payload: 'hei',
            },
        })
    })

    test('addItem errorOnStringify', () => {
        const storage = new MockWebStorage()
        const pool = cachePoolWebStorage({
            storage: storage,
            namespace: 'addItem_errorOnStringify',
        })

        const circular: any = { ref: null }
        circular.ref = circular

        pool.addItem(
            'hei',
            {
                status: 200,
                payload: circular,
            },
            3
        )()

        expect(storage.length).toBe(0)
    })

    test('addItem errorOnSave', () => {
        const storage = new MockWebStorage()

        Object.defineProperty(storage, 'setItem', {
            value: () => {
                throw new Error()
            },
        })

        const pool = cachePoolWebStorage({
            storage: storage,
            namespace: 'addItem_errorOnSave',
        })

        pool.addItem(
            'hei',
            {
                status: 200,
                payload: 'hello',
            },
            3
        )()

        expect(storage.length).toBe(0)
    })

    afterAll(() => {
        jest.clearAllTimers()
    })
})
