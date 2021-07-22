import { none, some } from 'fp-ts/Option'
import MockDate from 'mockdate'
import { cachePoolWebStorage } from '../../../src/http/cachePoolAdapters/cachePoolWebStorage'
import { MockStorage } from '../../mock/MockWebStorage'

describe('cachePoolWebStorage', () => {
    test('deleteItem', async () => {
        const storage = new MockStorage()

        storage.setItem('deleteItem_hei', 'hei')
        storage.setItem('deleteItem_hei2', 'hei2')

        const pool = cachePoolWebStorage({
            storage: storage,
            namespace: 'deleteItem',
        })

        expect(storage.length).toBe(2)

        await pool.deleteItem('hei')()

        expect(storage.length).toBe(1)
        expect(storage.getItem('deleteItem_hei')).toBeNull()
        expect(storage.getItem('deleteItem_hei2')).not.toBeNull()
    })

    test('clear', async () => {
        const storage = new MockStorage()

        storage.setItem('notDeleted', 'hei')
        storage.setItem('clear_hei', 'hei')
        storage.setItem('clear_hei2', 'hei2')

        const pool = cachePoolWebStorage({
            storage: storage,
            namespace: 'clear',
        })

        expect(storage.length).toBe(3)

        await pool.clear()

        expect(storage.length).toBe(1)
        expect(storage.getItem('clear_hei')).toBeNull()
        expect(storage.getItem('notDeleted')).not.toBeNull()
    })

    test('findItem', async () => {
        const storage = new MockStorage()

        MockDate.set(10)

        storage.setItem(
            'findItem_good',
            JSON.stringify({
                validUntil: 10 + 20 * 1000,
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

        const itemGood = await pool.findItem('good')()
        const itemNotValid = await pool.findItem('notValid')()
        const itemBad = await pool.findItem('bad')()

        expect(storage.length).toBe(1)
        expect(itemGood).toStrictEqual(some({ status: 200, payload: 'hei' }))
        expect(itemNotValid).toStrictEqual(none)
        expect(itemBad).toStrictEqual(none)
    })

    test('addItem', async () => {
        const storage = new MockStorage()
        const pool = cachePoolWebStorage({
            storage: storage,
            namespace: 'addItem',
        })

        MockDate.set(10)

        await pool.addItem(
            'hei',
            {
                status: 200,
                payload: 'hei',
            },
            3
        )()

        expect(storage.length).toBe(1)
        expect(JSON.parse(storage.getItem('addItem_hei') ?? '{}')).toStrictEqual({
            validUntil: 10 + 3 * 1000,
            item: {
                status: 200,
                payload: 'hei',
            },
        })
    })

    afterAll(() => {
        MockDate.reset()
    })
})
