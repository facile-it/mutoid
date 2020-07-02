import { of } from 'rxjs'
import { TestScheduler } from 'rxjs/testing'
import * as MS from '../src/state/index'

describe('state', () => {
    test('create', () => {
        const state = { name: 'mutoid' }
        const store = MS.ctor(() => ({ initState: state, name: 'test' }))

        expect(store().initState).toStrictEqual(state)

        const sSpy = jest.fn()
        store().state$.subscribe(sSpy)
        expect(sSpy.mock.calls.length).toBe(1)
        expect(sSpy.mock.calls[0][0]).toStrictEqual(state)
    })

    test('toTask', async () => {
        const store = MS.ctor(() => ({ name: 'test', initState: { name: 'mutoid' } }))

        const task = MS.toTask(store)

        store().state$.next({ name: 'hey' })
        const stateUpdatedHey = await task()
        expect(stateUpdatedHey.name).toBe('hey')

        store().state$.next({ name: 'ho' })
        const stateUpdatedResultHo = await task()
        expect(stateUpdatedResultHo.name).toBe('ho')
    })

    test('mutationRunner', async () => {
        const store = MS.ctor(() => ({ initState: { name: 'mutoid', age: 15 }, name: 'test' }))

        const task = MS.toTask(store)

        MS.mutationRunner(store, () =>
            MS.ctorMutation('test_mutation', () => s =>
                of({
                    ...s,
                    age: 16,
                })
            )
        )()

        const stateUpdatedHey = await task()
        expect(stateUpdatedHey.name).toBe('mutoid')
        expect(stateUpdatedHey.age).toBe(16)
    })

    test('mutationRunner with paylod', async () => {
        const store = MS.ctor(() => ({ initState: { name: 'mutoid', age: 15 }, name: 'state' }))

        const task = MS.toTask(store)

        const mutationRunner = MS.mutationRunner(store, () =>
            MS.ctorMutation('test_mutation', (name: string, age: number) => s =>
                of({
                    ...s,
                    name: name,
                    age: age,
                })
            )
        )

        mutationRunner('hey', 15)
        expect((await task()).name).toBe('hey')
        mutationRunner('ho', 16)
        const stateUpdatedHey = await task()
        expect(stateUpdatedHey.name).toBe('ho')
        expect(stateUpdatedHey.age).toBe(16)
    })

    test('mutationRunner with paylod takeuntil', () => {
        const store = MS.ctor(() => ({ initState: { name: 'mutoid', age: 15 }, name: 'test' }))

        const testScheduler = new TestScheduler((actual, expected) => {
            expect(actual).toStrictEqual(expected)
        })

        testScheduler.run(({ cold, expectObservable }) => {
            MS.mutationRunner(
                store,
                () =>
                    MS.ctorMutation('test_mutation_1', (name: string, age: number) => s =>
                        cold('-a', {
                            a: {
                                ...s,
                                name: name,
                                age: age,
                            },
                        })
                    ),
                cold('--a', { a: 1 })
            )('hey', 15)

            MS.mutationRunner(
                store,
                () =>
                    MS.ctorMutation('test_muation_2', (name: string, age: number) => s =>
                        cold('---a', {
                            a: {
                                ...s,
                                name: name,
                                age: age,
                            },
                        })
                    ),
                cold('--a', { a: 1 })
            )('ho', 16)

            expectObservable(store().state$).toBe('ab------', {
                a: { name: 'mutoid', age: 15 },
                b: { name: 'hey', age: 15 },
            })
        })
    })
})
