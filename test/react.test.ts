import { renderHook, act } from '@testing-library/react-hooks'
import { identity } from 'fp-ts/function'
import * as t from 'io-ts'
import { of } from 'rxjs'
import type { AjaxResponse } from 'rxjs/ajax'
import { delay } from 'rxjs/operators'
import * as MH from '../src/http'
import * as MR from '../src/react'
import * as MS from '../src/state'

describe('react', () => {
    test('useSelector', () => {
        const state = { name: 'mutoid' }
        const store = MS.ctor(() => ({ initState: state, name: 'test' }))

        const { result } = renderHook(() => MR.useSelector(store, identity))

        expect(result.current.name).toBe('mutoid')
    })

    test('useSelector', async () => {
        const state = { name: 'mutoid', age: 15 }
        const store = MS.ctor(() => ({ initState: state, name: 'test' as const }))

        const mutation = () =>
            MS.ctorMutation('test_mutation', () => (s: typeof state) =>
                of({
                    ...s,
                    age: 16,
                })
            )

        const { result } = renderHook(() => MR.useMutation(store, mutation))

        act(() => {
            result.current()
        })

        const task = MS.toTask(store)
        const stateUpdatedHey = await task()
        expect(stateUpdatedHey.name).toBe('mutoid')
        expect(stateUpdatedHey.age).toBe(16)
    })

    test('useSelector and killer', async () => {
        const state = { name: 'mutoid', age: 15 }
        const store = MS.ctor(() => ({ initState: state, name: 'test' as const }))

        const mutation = () =>
            MS.ctorMutation('test_mutation', () => (s: typeof state) =>
                of({
                    ...s,
                    age: 16,
                }).pipe(delay(1000))
            )

        const { result } = renderHook(() => MR.useMutation(store, mutation, { notifierTakeUntil: of(1) }))

        act(() => {
            result.current()
        })

        const task = MS.toTask(store)
        const stateUpdatedHey = await task()
        expect(stateUpdatedHey.name).toBe('mutoid')
        expect(stateUpdatedHey.age).toBe(15)
    })

    test('useSeleuseResourceFetcherctor', () => {
        const ajax = of({
            status: 200,
            response: 'hello',
        } as AjaxResponse)

        const resource = () =>
            MH.ajaxToResource(ajax, {
                200: t.string.decode,
            })

        const { result } = renderHook(() => MR.useResourceFetcher(resource))

        expect(result.current[0]._tag).toBe('init')

        act(() => {
            result.current[1]()
        })

        expect(result.current[0]._tag).toBe('done')
    })

    test('useSeleuseResourceFetcherctor killed', () => {
        const ajax = of({
            status: 200,
            response: 'hello',
        } as AjaxResponse)

        const resource = () =>
            MH.ajaxToResource(ajax.pipe(delay(1000)), {
                200: t.string.decode,
            })

        const { result } = renderHook(() => MR.useResourceFetcher(resource, { notifierTakeUntil: of(1) }))

        expect(result.current[0]._tag).toBe('init')

        act(() => {
            result.current[1]()
        })

        expect(result.current[0]._tag).toBe('init')
    })

    test('useSeleuseResourceFetcherctor mapAcknowledged', () => {
        const ajax = of({
            status: 200,
            response: 'hello',
        } as AjaxResponse)

        const resource = () =>
            MH.ajaxToResource(ajax, {
                200: t.string.decode,
            })

        const { result } = renderHook(() =>
            MR.useResourceFetcher(resource, {
                mapAcknowledged: s => {
                    switch (s._tag) {
                        case 'done':
                            return { _tag: 'success' }
                        case 'fail':
                            return { _tag: 'error' }
                    }
                },
            })
        )

        expect(result.current[0]._tag).toBe('init')

        act(() => {
            result.current[1]()
        })

        expect(result.current[0]._tag).toBe('success')
    })
})
