import * as E from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'
import * as t from 'io-ts'
import { of, Observable } from 'rxjs'
import type { AjaxError, AjaxResponse } from 'rxjs/ajax'
import { map } from 'rxjs/operators'
import { TestScheduler } from 'rxjs/testing'
import * as MH from '../src/http'
import * as MS from '../src/state/index'

declare module '../src/state/stores' {
    interface Stores {
        http_test: 'test'
    }
}

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
                a: { _tag: 'submitted' },
                b: { _tag: 'done', data: { status: 200, payload: 'hello' } },
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
                a: { _tag: 'submitted' },
                b: {
                    _tag: 'fail',
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
                a: { _tag: 'submitted' },
                b: {
                    _tag: 'fail',
                    error: {
                        type: 'unexpectedResponse',
                        detail: { status: 500, response: 'hello', name: 'AjaxError' },
                    },
                },
            })
        })
    })

    test('ajaxToResource done 500done 500', () => {
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
                a: { _tag: 'submitted' },
                b: {
                    _tag: 'done',
                    data: {
                        status: 500,
                        payload: 2,
                    },
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
                a: { _tag: 'submitted' },
                b: {
                    _tag: 'fail',
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
                200: (i: unknown) =>
                    pipe(
                        t.type({ data: t.number }).decode(i),
                        E.mapLeft(() => 'error')
                    ),
            })

            expectObservable(resource).toBe('a-(b|)', {
                a: { _tag: 'submitted' },
                b: {
                    _tag: 'fail',
                    error: {
                        type: 'decodeError',
                        detail: 'error',
                    },
                },
            })
        })
    })

    test('ajaxToResource already fail', () => {
        testSchedulerBuilder().run(({ cold, expectObservable }) => {
            const ajax = cold<MH.ResourceAjaxFail<string>>('--a', {
                a: MH.resourceAjaxFail<string>({
                    type: 'appError',
                    detail: 'bhoo',
                }),
            })

            const resource = MH.ajaxToResource(ajax, {
                200: t.string.decode,
            })

            expectObservable(resource).toBe('a-(b|)', {
                a: { _tag: 'submitted' },
                b: {
                    _tag: 'fail',
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

        type nameResource = MH.ResourceTypeOf<typeof decoders>

        const state: { name: nameResource } = { name: MH.resourceInit }
        const store = MS.ctor(() => ({ initState: state, name: 'http_test' }))

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

        expect((await task()).name._tag).toBe('init')
        MS.mutationRunner(store, mutation)()
        expect((await task()).name._tag).toBe('done')
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
            onFail: onfail,
        }

        const ts: [MH.ResourceTypeOf<{ 200: any }>, jest.Mock<any, any>][] = [
            [MH.resourceInit, onInit],
            [MH.resourceSubmitted, onSubmitted],
            [MH.resourceDone({ status: 200, payload: 'hello' }), onDone],
            [MH.resourceFail({ type: 'unknownError', detail: 'boom' }), onfail],
        ]

        ts.forEach(([r, m]) => {
            MH.resourceFold_(r)(c)
            expect(m.mock.calls.length).toBe(1)
            jest.resetAllMocks()
        })
    })

    test('guards', () => {
        const init = MH.resourceInit
        const submitted = MH.resourceSubmitted
        const done = MH.resourceDone<MH.ResourceData<200, string>>({ status: 200, payload: 'hello' })
        const fail = MH.resourceFail({ type: 'unknownError', detail: 'boom' })

        expect(MH.isResourceInit(init)).toBe(true)
        expect(MH.isResourcePending(init)).toBe(true)
        expect(MH.isResourceStarted(init)).toBe(false)
        expect(MH.isResourceAcknowledged(init)).toBe(false)

        expect(MH.isResourceSubmitted(submitted)).toBe(true)
        expect(MH.isResourcePending(submitted)).toBe(true)
        expect(MH.isResourceStarted(submitted)).toBe(true)
        expect(MH.isResourceAcknowledged(submitted)).toBe(false)

        expect(MH.isResourceDone(done)).toBe(true)
        expect(MH.isResourcePending(done)).toBe(false)
        expect(MH.isResourceStarted(done)).toBe(true)
        expect(MH.isResourceAcknowledged(done)).toBe(true)

        expect(MH.isResourceFail(fail)).toBe(true)
        expect(MH.isResourcePending(fail)).toBe(false)
        expect(MH.isResourceStarted(fail)).toBe(true)
        expect(MH.isResourceAcknowledged(fail)).toBe(true)

        expect(MH.isResourceInit(submitted)).toBe(false)
        expect(MH.isResourceSubmitted(init)).toBe(false)
        expect(MH.isResourceDone(init)).toBe(false)
        expect(MH.isResourceFail(init)).toBe(false)
    })
})
