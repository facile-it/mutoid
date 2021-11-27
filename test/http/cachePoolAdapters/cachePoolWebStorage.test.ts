import { none, some } from 'fp-ts/Option'
import { cachePoolWebStorage } from '../../../src/http/cachePoolAdapters/cachePoolWebStorage'
import { MockWebStorage } from '../../_mock/MockWebStorage'

describe('cachePoolWebStorage', () => {
    const systemTime = new Date('2021-01-01').getTime()

    test('deleteItem', async () => {
        const storage = new MockWebStorage()

        storage.setItem('deleteItem_hei', 'hei')
        storage.setItem('deleteItem_hei2', 'hei2')
        storage.setItem('deleteItem_hei3', 'hei3')

        const pool = cachePoolWebStorage({
            storage: storage,
            namespace: 'deleteItem',
        })

        expect(storage.length).toBe(3)

        await pool.deleteItem('hei')()
        pool.deleteItemS('hei2')

        expect(storage.length).toBe(1)
        expect(storage.getItem('deleteItem_hei')).toBeNull()
        expect(storage.getItem('deleteItem_hei2')).toBeNull()
        expect(storage.getItem('deleteItem_hei3')).not.toBeNull()
    })

    test('clear', async () => {
        const storage = new MockWebStorage()

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

        storage.setItem('clear_hei3', 'hei3')
        storage.setItem('clear_hei4', 'hei4')

        expect(storage.length).toBe(3)

        pool.clearS()

        expect(storage.length).toBe(1)
        expect(storage.getItem('clear_hei3')).toBeNull()
        expect(storage.getItem('notDeleted')).not.toBeNull()
    })

    test('findItem async', async () => {
        const storage = new MockWebStorage()

        jest.useFakeTimers('modern').setSystemTime(systemTime)

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

        const itemGood = await pool.findItem('good')()
        const itemNotValid = await pool.findItem('notValid')()
        const itemBad = await pool.findItem('bad')()
        const itemGood2 = pool.findItemS('good')
        const itemNotValid2 = pool.findItemS('notValid')
        const itemBad2 = pool.findItemS('bad')

        expect(storage.length).toBe(1)
        expect(itemGood).toStrictEqual(some({ status: 200, payload: 'hei' }))
        expect(itemGood2).toStrictEqual(some({ status: 200, payload: 'hei' }))
        expect(itemNotValid).toStrictEqual(none)
        expect(itemNotValid2).toStrictEqual(none)
        expect(itemBad).toStrictEqual(none)
        expect(itemBad2).toStrictEqual(none)
    })

    test('addItem', async () => {
        const storage = new MockWebStorage()
        const pool = cachePoolWebStorage({
            storage: storage,
            namespace: 'addItem',
        })

        jest.useFakeTimers('modern').setSystemTime(systemTime)

        await pool.addItem(
            'hei',
            {
                status: 200,
                payload: 'hei',
            },
            3
        )()

        pool.addItemS(
            'hei2',
            {
                status: 200,
                payload: 'hei2',
            },
            4
        )

        expect(storage.length).toBe(2)
        expect(JSON.parse(storage.getItem('addItem_hei') ?? '{}')).toStrictEqual({
            validUntil: systemTime + 3 * 1000,
            item: {
                status: 200,
                payload: 'hei',
            },
        })
        expect(JSON.parse(storage.getItem('addItem_hei2') ?? '{}')).toStrictEqual({
            validUntil: systemTime + 4 * 1000,
            item: {
                status: 200,
                payload: 'hei2',
            },
        })
    })

    test('addItem errorOnStringify', async () => {
        const storage = new MockWebStorage()
        const pool = cachePoolWebStorage({
            storage: storage,
            namespace: 'addItem_errorOnStringify',
        })

        const circular: any = { ref: null }
        circular.ref = circular

        await pool.addItem(
            'hei',
            {
                status: 200,
                payload: circular,
            },
            3
        )()

        pool.addItemS(
            'hei',
            {
                status: 200,
                payload: circular,
            },
            3
        )

        expect(storage.length).toBe(0)
    })

    test('addItem errorOnSave', async () => {
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

        await pool.addItem(
            'hei',
            {
                status: 200,
                payload: 'hello',
            },
            3
        )()

        pool.addItemS(
            'hei',
            {
                status: 200,
                payload: 'hello',
            },
            3
        )

        expect(storage.length).toBe(0)
    })

    afterAll(() => {
        jest.clearAllTimers()
    })
})
