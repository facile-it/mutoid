import * as t from 'io-ts'
import { of, Observable } from 'rxjs'
import type { AjaxError, AjaxResponse } from 'rxjs/ajax'
import { map } from 'rxjs/operators'
import { TestScheduler } from 'rxjs/testing'
import * as MH from '../src/http'
import * as MS from '../src/state/index'

describe('http', () => {
    const testSchedulerBuilder = () =>
        new TestScheduler((actual, expected) => {
            expect(actual).toStrictEqual(expected)
        })

    test('ajaxToResource done 200', () => {
        testSchedulerBuilder().run(({ cold, expectObservable }) => {
            const ajax = cold<AjaxResponse>('--a', {
                a: {
                    status: 200,
                    response: 'hello',
                } as AjaxResponse,
            })

            const resource = MH.ajaxToResource(ajax, {
                200: t.string.decode,
            })

            expectObservable(resource).toBe('a-(b|)', {
                a: { tag: 'submitted' },
                b: { tag: 'done', status: 200, payload: 'hello' },
            })
        })
    })

    test('ajaxToResource done notExpected response', () => {
        testSchedulerBuilder().run(({ cold, expectObservable }) => {
            const ajax = cold<AjaxResponse>('--a', {
                a: {
                    status: 201,
                    response: 'hello',
                } as AjaxResponse,
            })

            const resource = MH.ajaxToResource(ajax, {
                200: t.string.decode,
            })

            expectObservable(resource).toBe('a-(b|)', {
                a: { tag: 'submitted' },
                b: {
                    tag: 'fail',
                    error: {
                        type: 'unexpectedResponse',
                        detail: {
                            status: 201,
                            response: 'hello',
                        },
                    },
                },
            })
        })
    })

    test('ajaxToResource fail unexpectedResponse', () => {
        testSchedulerBuilder().run(({ cold, expectObservable }) => {
            const ajaxError = {
                status: 500,
                response: 'hello',
                name: 'AjaxError',
            } as AjaxError

            const ajax = cold<AjaxResponse>('--#', undefined, ajaxError)

            const resource = MH.ajaxToResource(ajax, {
                200: t.string.decode,
            })

            expectObservable(resource).toBe('a-(b|)', {
                a: { tag: 'submitted' },
                b: {
                    tag: 'fail',
                    error: {
                        type: 'unexpectedResponse',
                        detail: { status: 500, response: 'hello', name: 'AjaxError' },
                    },
                },
            })
        })
    })

    test('ajaxToResource done 500', () => {
        testSchedulerBuilder().run(({ cold, expectObservable }) => {
            const ajaxError = {
                status: 500,
                response: 2,
                name: 'AjaxError',
            } as AjaxError

            const ajax = cold<AjaxResponse>('--#', undefined, ajaxError)

            const resource = MH.ajaxToResource(ajax, {
                200: t.string.decode,
                500: t.number.decode,
            })

            expectObservable(resource).toBe('a-(b|)', {
                a: { tag: 'submitted' },
                b: {
                    tag: 'done',
                    status: 500,
                    payload: 2,
                },
            })
        })
    })

    test('ajaxToResource fail unknownError', () => {
        testSchedulerBuilder().run(({ cold, expectObservable }) => {
            const ajaxError = {
                status: 500,
                response: 'hello',
                name: 'AjaxErrorWrong',
            } as AjaxError

            const ajax = cold<AjaxResponse>('--#', undefined, ajaxError)

            const resource = MH.ajaxToResource(ajax, {
                200: t.string.decode,
            })

            expectObservable(resource).toBe('a-(b|)', {
                a: { tag: 'submitted' },
                b: {
                    tag: 'fail',
                    error: {
                        type: 'unknownError',
                        detail: { status: 500, response: 'hello', name: 'AjaxErrorWrong' },
                    },
                },
            })
        })
    })

    test('ajaxToResource fail decodeError', () => {
        testSchedulerBuilder().run(({ cold, expectObservable }) => {
            const ajax = cold<AjaxResponse>('--a', {
                a: {
                    status: 200,
                    response: {
                        data: 'hello',
                    },
                } as AjaxResponse,
            })

            const resource = MH.ajaxToResource(ajax, {
                200: t.type({
                    data: t.number,
                }).decode,
            })

            expectObservable(resource).toBe('a-(b|)', {
                a: { tag: 'submitted' },
                b: {
                    tag: 'fail',
                    error: {
                        type: 'decodeError',
                        detail: [
                            {
                                key: '',
                                actual: { data: 'hello' },
                                requestType: '{ data: number }',
                            },
                            { key: 'data', actual: 'hello', requestType: 'number' },
                        ],
                    },
                },
            })
        })
    })

    test('ajaxToResource already fail', () => {
        testSchedulerBuilder().run(({ cold, expectObservable }) => {
            const ajax = cold<MH.ResourceFail<string>>('--a', {
                a: MH.resourceFail<string>({
                    type: 'appError',
                    detail: 'bhoo',
                }),
            })

            const resource = MH.ajaxToResource(ajax, {
                200: t.string.decode,
            })

            expectObservable(resource).toBe('a-(b|)', {
                a: { tag: 'submitted' },
                b: {
                    tag: 'fail',
                    error: {
                        type: 'appError',
                        detail: 'bhoo',
                    },
                },
            })
        })
    })

    test('resourceFetcherToMutation done 200', async () => {
        const decoders = {
            200: t.type({
                name: t.string,
            }).decode,
        }

        type nameResource = MH.Resource<typeof decoders>

        const state: { name: nameResource } = { name: MH.resourceInit }
        const store = MS.ctor(() => ({ initState: state, name: 'test' }))

        const ajax = of({
            status: 200,
            response: {
                name: 'hey',
            },
        } as AjaxResponse)

        const mutation = () =>
            MS.ctorMutation(
                'test' as const,
                MH.resourceFetcherToMutationEffect(
                    () => MH.ajaxToResource(ajax, decoders),
                    (o, _S: typeof state): Observable<typeof state> => o.pipe(map(n => ({ name: n })))
                )
            )

        const task = MS.toTask(store)

        expect((await task()).name.tag).toBe('init')
        MS.mutationRunner(store, mutation)()
        expect((await task()).name.tag).toBe('done')
    })

    test('resourceFold', () => {
        const onInit = jest.fn()
        const onDone = jest.fn()
        const onSubmitted = jest.fn()
        const onfail = jest.fn()

        const c = {
            onInit: onInit,
            onDone: onDone,
            onSubmitted: onSubmitted,
            onfail: onfail,
        }

        const ts: [MH.Resource<any>, jest.Mock<any, any>][] = [
            [MH.resourceInit, onInit],
            [MH.resourceSubmitted, onSubmitted],
            [MH.resourceDone(200, 'hello') as any, onDone],
            [MH.resourceFail({ type: 'unknownError', detail: 'boom' }), onfail],
        ]

        ts.forEach(([r, m]) => {
            MH.resourceFold(r)(c)
            expect(m.mock.calls.length).toBe(1)
            jest.resetAllMocks()
        })
    })
})
