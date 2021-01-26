import * as E from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'
import * as t from 'io-ts'
import { of, Observable } from 'rxjs'
import type { AjaxError, AjaxResponse } from 'rxjs/ajax'
import { map } from 'rxjs/operators'
import { TestScheduler } from 'rxjs/testing'
import * as _ from '../../src/http/ObservableResource'
import * as RES from '../../src/http/Resource'
import * as MS from '../../src/state/index'

declare module '../../src/state/stores' {
    interface Stores {
        http_test: 'test'
    }
}

describe('ObservableResource', () => {
    const testSchedulerBuilder = () =>
        new TestScheduler((actual, expected) => {
            expect(actual).toStrictEqual(expected)
        })

    test('fromAjax done 200', () => {
        testSchedulerBuilder().run(({ cold, expectObservable }) => {
            const ajax = cold<AjaxResponse>('--a', {
                a: {
                    status: 200,
                    response: 'hello',
                } as AjaxResponse,
            })

            const resource = _.fromAjax(ajax, {
                200: t.string.decode,
            })

            expectObservable(resource).toBe('a-(b|)', {
                a: { _tag: 'submitted' },
                b: { _tag: 'done', data: { status: 200, payload: 'hello' } },
            })
        })
    })

    test('fromAjax done notExpected response', () => {
        testSchedulerBuilder().run(({ cold, expectObservable }) => {
            const ajax = cold<AjaxResponse>('--a', {
                a: {
                    status: 201,
                    response: 'hello',
                } as AjaxResponse,
            })

            const resource = _.fromAjax(ajax, {
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

    test('fromAjax fail unexpectedResponse', () => {
        testSchedulerBuilder().run(({ cold, expectObservable }) => {
            const ajaxError = {
                status: 500,
                response: 'hello',
                name: 'AjaxError',
            } as AjaxError

            const ajax = cold<AjaxResponse>('--#', undefined, ajaxError)

            const resource = _.fromAjax(ajax, {
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

    test('fromAjax done 500done 500', () => {
        testSchedulerBuilder().run(({ cold, expectObservable }) => {
            const ajaxError = {
                status: 500,
                response: 2,
                name: 'AjaxError',
            } as AjaxError

            const ajax = cold<AjaxResponse>('--#', undefined, ajaxError)

            const resource = _.fromAjax(ajax, {
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

    test('fromAjax fail unknownError', () => {
        testSchedulerBuilder().run(({ cold, expectObservable }) => {
            const ajaxError = {
                status: 500,
                response: 'hello',
                name: 'AjaxErrorWrong',
            } as AjaxError

            const ajax = cold<AjaxResponse>('--#', undefined, ajaxError)

            const resource = _.fromAjax(ajax, {
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

    test('fromAjax fail decodeError', () => {
        testSchedulerBuilder().run(({ cold, expectObservable }) => {
            const ajax = cold<AjaxResponse>('--a', {
                a: {
                    status: 200,
                    response: {
                        data: 'hello',
                    },
                } as AjaxResponse,
            })

            const resource = _.fromAjax(ajax, {
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

    test('fromAjax already fail', () => {
        testSchedulerBuilder().run(({ cold, expectObservable }) => {
            const ajax = cold<RES.ResourceAjaxFail<string>>('--a', {
                a: RES.ajaxFail<string>({
                    type: 'appError',
                    detail: 'bhoo',
                }),
            })

            const resource = _.fromAjax(ajax, {
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

    test('toMutationEffect done 200', async () => {
        const decoders = {
            200: t.type({
                name: t.string,
            }).decode,
        }

        type nameResource = RES.ResourceTypeOf<typeof decoders>

        const state: { name: nameResource } = { name: RES.init }
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
                _.toMutationEffect(
                    () => _.fromAjax(ajax, decoders),
                    (o, _S: typeof state): Observable<typeof state> => o.pipe(map(n => ({ name: n })))
                )
            )

        const task = MS.toTask(store)

        expect((await task()).name._tag).toBe('init')
        MS.mutationRunner(store, mutation)()
        expect((await task()).name._tag).toBe('done')
    })
})
