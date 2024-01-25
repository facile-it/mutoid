import { renderHook, act } from '@testing-library/react'
import { identity } from 'fp-ts/function'
import * as t from 'io-ts'
import { firstValueFrom, of } from 'rxjs'
import type { AjaxResponse } from 'rxjs/ajax'
import { delay, take } from 'rxjs/operators'
import * as OR from '../../src/http/ObservableResource'
import * as MR from '../../src/react'
import * as MS from '../../src/state'

describe('react', () => {
    test('useSelector', () => {
        const state = { name: 'mutoid' }
        const store = MS.ctor({ initState: state, name: 'test' })

        const { result } = renderHook(() => MR.useSelector(store, identity))

        expect(result.current.name).toBe('mutoid')
    })

    test('useSelector', async () => {
        const state = { name: 'mutoid', age: 15 }
        const store = MS.ctor({ initState: state, name: 'test' as const })

        const mutation = () =>
            MS.ctorMutation(
                'test_mutation',
                () => (s: typeof state) =>
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
        const store = MS.ctor({ initState: state, name: 'test' as const })

        const mutation = () =>
            MS.ctorMutation(
                'test_mutation',
                () => (s: typeof state) =>
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

    test('useFetchObservableResource', () => {
        const ajax = of({
            status: 200,
            response: 'hello',
        } as AjaxResponse<unknown>)

        const resource = () =>
            OR.fromAjax(ajax, {
                200: t.string.decode,
            })

        const { result } = renderHook(() => MR.useFetchObservableResource(resource))

        expect(result.current[0]._tag).toBe('init')

        act(() => {
            result.current[1]()
        })

        expect(result.current[0]._tag).toBe('done')
    })

    test('useFetchReaderObservableResource', () => {
        const ajax = of({
            status: 200,
            response: 'hello',
        } as AjaxResponse<unknown>)

        const resource = () => (d: { ajax: typeof ajax }) =>
            OR.fromAjax(d.ajax, {
                200: t.string.decode,
            })

        const { result } = renderHook(() => MR.useFetchReaderObservableResource(resource, { ajax }))

        expect(result.current[0]._tag).toBe('init')

        act(() => {
            result.current[1]()
        })

        expect(result.current[0]._tag).toBe('done')
    })

    test('useFetchReaderObservableResource reset', () => {
        const ajax = of({
            status: 200,
            response: 'hello',
        } as AjaxResponse<unknown>)

        const resource = () => (d: { ajax: typeof ajax }) =>
            OR.fromAjax(d.ajax, {
                200: t.string.decode,
            })

        const { result } = renderHook(() => MR.useFetchReaderObservableResource(resource, { ajax }))

        expect(result.current[0]._tag).toBe('init')

        act(() => {
            result.current[1]()
        })

        expect(result.current[0]._tag).toBe('done')

        act(() => {
            result.current[2]()
        })

        expect(result.current[0]._tag).toBe('init')
    })

    test('useFetchReaderObservableResource unsubscribe on unMount', async () => {
        const ajax = of({
            status: 200,
            response: 'hello',
        } as AjaxResponse<unknown>)

        const resource = () => (d: { ajax: typeof ajax }) =>
            OR.fromAjax(d.ajax.pipe(delay(1000)), {
                200: t.string.decode,
            })

        const { result } = renderHook(() => MR.useFetchReaderObservableResource(resource, { ajax }))

        expect(result.current[0]._tag).toBe('init')

        act(() => {
            result.current[1]()
        })

        expect(result.current[0]._tag).toBe('submitted')
    })

    test('useFetchObservableResource killed', () => {
        const ajax = of({
            status: 200,
            response: 'hello',
        } as AjaxResponse<unknown>)

        const resource = () =>
            OR.fromAjax(ajax.pipe(delay(1000)), {
                200: t.string.decode,
            })

        const { result } = renderHook(() => MR.useFetchObservableResource(resource, { notifierTakeUntil: of(1) }))

        expect(result.current[0]._tag).toBe('init')

        act(() => {
            result.current[1]()
        })

        expect(result.current[0]._tag).toBe('init')
    })

    test('useResourceFetcher mapAcknowledged', () => {
        const ajax = of({
            status: 200,
            response: 'hello',
        } as AjaxResponse<unknown>)

        const resource = () =>
            OR.fromAjax(ajax, {
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

    test('useStore', async () => {
        const state = { name: 'mutoid' }
        const store = () => MS.ctor({ initState: state, name: 'test' })

        const { result } = renderHook(() => MR.useStore(store))

        expect(result.current.name).toBe('test')

        act(() => {
            result.current.state$.next({ name: 'boom' })
        })

        const s = await firstValueFrom(result.current.state$.pipe(take(1)))
        expect(s.name).toBe('boom')
    })
})
