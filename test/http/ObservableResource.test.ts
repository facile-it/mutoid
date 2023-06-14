import * as E from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'
import * as t from 'io-ts'
import { firstValueFrom, of } from 'rxjs'
import type { AjaxError, AjaxResponse } from 'rxjs/ajax'
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
    describe('type class members', () => {
        const length = (s: string): number => s.length
        const lengthR = (s: string): _.ObservableResource<string, number> => _.done(s.length)
        const double = (n: number): number => n * 2

        const run = <E, A>(ror: _.ObservableResource<E, A>) => firstValueFrom(ror)

        test('map', async () => {
            expect(await run(pipe(_.done('abc'), _.map(length)))).toStrictEqual(RES.done(3))
            expect(await run(pipe(_.fail('s'), _.map(length)))).toStrictEqual(RES.fail('s'))
        })

        test('bimap', async () => {
            expect(await run(pipe(_.init, _.bimap(double, length)))).toStrictEqual(RES.init)
            expect(await run(pipe(_.submitted, _.bimap(double, length)))).toStrictEqual(RES.submitted)
            expect(await run(pipe(_.done('abc'), _.bimap(double, length)))).toStrictEqual(RES.done(3))
            expect(await run(pipe(_.fail(1), _.bimap(double, length)))).toStrictEqual(RES.fail(2))
        })

        test('mapLeft', async () => {
            expect(await run(pipe(_.done('abc'), _.mapLeft(double)))).toStrictEqual(RES.done('abc'))
            expect(await run(pipe(_.fail(1), _.mapLeft(double)))).toStrictEqual(RES.fail(2))
        })

        test('ap', async () => {
            expect(await run(pipe(_.done(length), _.ap(_.done('abc'))))).toStrictEqual(RES.done(3))
            expect(await run(pipe(_.done(length), _.ap(_.fail('maError'))))).toStrictEqual(RES.fail('maError'))
        })

        test('chain', async () => {
            expect(await run(pipe(_.done('abc'), _.chain(lengthR)))).toStrictEqual(RES.done(3))
            expect(await run(pipe(_.fail<string, string>('maError'), _.chain(lengthR)))).toStrictEqual(
                RES.fail('maError')
            )
        })
    })

    const testSchedulerBuilder = () =>
        new TestScheduler((actual, expected) => {
            expect(actual).toStrictEqual(expected)
        })

    test('fromAjax done 200', () => {
        testSchedulerBuilder().run(({ cold, expectObservable }) => {
            const ajax = cold<AjaxResponse<unknown>>('--a', {
                a: {
                    status: 200,
                    response: 'hello',
                } as AjaxResponse<unknown>,
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
            const ajax = cold<AjaxResponse<unknown>>('--a', {
                a: {
                    status: 201,
                    response: 'hello',
                } as AjaxResponse<unknown>,
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

            const ajax = cold<AjaxResponse<unknown>>('--#', undefined, ajaxError)

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

            const ajax = cold<AjaxResponse<unknown>>('--#', undefined, ajaxError)

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

            const ajax = cold<AjaxResponse<unknown>>('--#', undefined, ajaxError)

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
            const ajax = cold<AjaxResponse<unknown>>('--a', {
                a: {
                    status: 200,
                    response: {
                        data: 'hello',
                    },
                } as AjaxResponse<unknown>,
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
                        statusCode: 200,
                        detail: 'error',
                    },
                },
            })
        })
    })

    test('fromAjax already fail', () => {
        testSchedulerBuilder().run(({ cold, expectObservable }) => {
            const ajax = cold<RES.ResourceFail<RES.ResourceAjaxError<string>>>('--a', {
                a: RES.ajaxFailOnly({
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
        const store = MS.ctor({ initState: state, name: 'http_test' })

        const ajax = of({
            status: 200,
            response: {
                name: 'hey',
            },
        } as AjaxResponse<unknown>)

        const mutation = () =>
            pipe(
                () => _.fromAjax(ajax, decoders),
                _.fetchToMutationEffect((_s: typeof state) => name => ({ name })),
                MS.ctorMutationC('test')
            )
        const task = MS.toTask(store)

        expect((await task()).name._tag).toBe('init')
        MS.mutationRunner(store, mutation)()
        expect((await task()).name._tag).toBe('done')
    })
})
