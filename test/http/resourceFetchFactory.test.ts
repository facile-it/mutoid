import * as E from 'fp-ts/Either'
import * as R from 'fp-ts/Reader'
import * as t from 'io-ts'
import { lastValueFrom, of, throwError } from 'rxjs'
import type { ajax } from 'rxjs/ajax'
import { cachePoolWebStorage } from '../../src/http/cachePoolAdapters/cachePoolWebStorage'
import * as RESFF from '../../src/http/resourceFetchFactory'
import { MockWebStorage } from '../_mock/MockWebStorage'

function logError<E extends { error: string }>(e: E): R.Reader<{ logger: (e: string) => void }, void> {
    return R.asks<{ logger: (e: string) => void }, void>(({ logger }) => {
        logger(e.error)
    })
}

describe('resourceFetchFactory ResourceBad', () => {
    test('resourceBadRejected', () => {
        const result = {
            type: 'rejected',
            error: 'clientError',
            detail: 'hei',
            statusCode: 0,
            errorMessage: 'clientError',
        }

        const r1 = RESFF.resourceBadRejected({ error: 'clientError', detail: 'hei' })
        expect(r1).toStrictEqual(result)

        const r2 = RESFF.resourceBadRejected({
            error: 'clientError',
            detail: 'hei',
            statusCode: 0,
            errorMessage: 'clientError',
        })
        expect(r2).toStrictEqual(result)
    })

    test('resourceBadRejected', () => {
        const result = {
            type: 'fail',
            error: 'decodeError',
            detail: 'hei',
            statusCode: 0,
            errorMessage: 'decodeError',
        }

        const r1 = RESFF.resourceBadFail({ error: 'decodeError', detail: 'hei' })
        expect(r1).toStrictEqual(result)

        const r2 = RESFF.resourceBadFail({
            error: 'decodeError',
            detail: 'hei',
            statusCode: 0,
            errorMessage: 'decodeError',
        })
        expect(r2).toStrictEqual(result)
    })
})

describe('resourceFetchFactory fetchFactory', () => {
    const ff = RESFF.fetchFactory({ loggerFail: logError })
    const ROR = ff(
        {
            method: 'GET',
            url: 'http://url',
        },
        () => ({ 200: t.string.decode, 400: E.right, 404: E.right, 301: E.right }),
        [200]
    )

    test('fetchFactory 200 ', async () => {
        const logger = jest.fn()
        const ajaxMock = (() =>
            of({
                status: 200,
                response: 'hello',
            })) as any as typeof ajax
        const r = await lastValueFrom(ROR({ ajax: ajaxMock, logger }))
        expect(r).toStrictEqual({ _tag: 'done', data: { status: 200, payload: 'hello' } })
        expect(logger.mock.calls.length).toBe(0)
    })

    test('fetchFactory 404', async () => {
        const logger = jest.fn()

        const ajaxMock = (() =>
            of({
                status: 404,
                response: 'any response',
            })) as any as typeof ajax
        const r = await lastValueFrom(ROR({ ajax: ajaxMock, logger }))

        expect(r).toStrictEqual({
            _tag: 'fail',
            error: {
                type: 'rejected',
                error: 'notFound',
                errorMessage: '[fetchFactory] notFound http://url',
                statusCode: 404,
                detail: 'any response',
            },
        })
        expect(logger.mock.calls.length).toBe(1)
        expect(logger.mock.calls[0][0]).toBe('notFound')
    })

    test('fetchFactory 301', async () => {
        const logger = jest.fn()

        const ajaxMock = (() =>
            of({
                status: 301,
                response: 'any response',
            })) as any as typeof ajax
        const r = await lastValueFrom(ROR({ ajax: ajaxMock, logger }))

        expect(r).toStrictEqual({
            _tag: 'fail',
            error: {
                type: 'fail',
                error: 'fail',
                errorMessage: '[fetchFactory] fail http://url',
                statusCode: 301,
                detail: 'any response',
            },
        })
        expect(logger.mock.calls.length).toBe(1)
        expect(logger.mock.calls[0][0]).toBe('fail')
    })

    test('fetchFactory 400 ', async () => {
        const logger = jest.fn()

        const ajaxMock = (() =>
            of({
                status: 400,
                response: 'any response',
            })) as any as typeof ajax
        const r = await lastValueFrom(ROR({ ajax: ajaxMock, logger }))

        expect(r).toStrictEqual({
            _tag: 'fail',
            error: {
                type: 'rejected',
                error: 'clientError',
                errorMessage: '[fetchFactory] clientError http://url',
                statusCode: 400,
                detail: 'any response',
            },
        })
        expect(logger.mock.calls.length).toBe(1)
        expect(logger.mock.calls[0][0]).toBe('clientError')
    })

    test('fetchFactory 500', async () => {
        const logger = jest.fn()

        const ajaxMock = (() =>
            of({
                status: 500,
                response: 'any response',
            })) as any as typeof ajax
        const r = await lastValueFrom(ROR({ ajax: ajaxMock, logger }))

        expect(r).toStrictEqual({
            _tag: 'fail',
            error: {
                type: 'fail',
                statusCode: 500,
                error: 'unexpectedResponse',
                errorMessage: '[fetchFactory] unexpectedResponse http://url',
                detail: { status: 500, response: 'any response' },
            },
        })
        expect(logger.mock.calls.length).toBe(1)
        expect(logger.mock.calls[0][0]).toBe('unexpectedResponse')
    })

    test('fetchFactory 0 networkError', async () => {
        const logger = jest.fn()

        const ajaxMock = (() =>
            of({
                status: 0,
                response: 'any response',
            })) as any as typeof ajax
        const r = await lastValueFrom(ROR({ ajax: ajaxMock, logger }))

        expect(r).toStrictEqual({
            _tag: 'fail',
            error: {
                type: 'fail',
                statusCode: 0,
                error: 'networkError',
                errorMessage: '[fetchFactory] networkError http://url',
                detail: { status: 0, response: 'any response' },
            },
        })
        expect(logger.mock.calls.length).toBe(1)
        expect(logger.mock.calls[0][0]).toBe('networkError')
    })

    test('fetchFactory 0 unknownError', async () => {
        const logger = jest.fn()

        const ajaxMock = (() => throwError('hello error')) as any as typeof ajax
        const r = await lastValueFrom(ROR({ ajax: ajaxMock, logger }))

        expect(r).toStrictEqual({
            _tag: 'fail',
            error: {
                type: 'fail',
                statusCode: 0,
                error: 'unknownError',
                errorMessage: '[fetchFactory] unknownError http://url',
                detail: 'hello error',
            },
        })
        expect(logger.mock.calls.length).toBe(1)
        expect(logger.mock.calls[0][0]).toBe('unknownError')
    })

    test('fetchFactory 200 decodeError', async () => {
        const logger = jest.fn()
        const ajaxMock = (() =>
            of({
                status: 200,
                response: 1,
            })) as any as typeof ajax
        const r = await lastValueFrom(ROR({ ajax: ajaxMock, logger }))

        expect(r).toStrictEqual({
            _tag: 'fail',
            error: {
                type: 'fail',
                statusCode: 200,
                error: 'decodeError',
                errorMessage: '[fetchFactory] decodeError http://url',
                detail: 'Invalid value 1 supplied to : string',
            },
        })
        expect(logger.mock.calls.length).toBe(1)
        expect(logger.mock.calls[0][0]).toBe('decodeError')
    })
})

describe('resourceFetchFactory fetchCacheableFactory', () => {
    const systemTime = new Date('2021-01-01').getTime()

    interface cacheDeps {
        session: string
    }

    const ff = RESFF.fetchCacheableFactory({
        loggerFail: logError,
        createCacheKey: () => (d: cacheDeps) => `${d.session}_key`,
    })
    const ROR = ff(
        {
            method: 'GET',
            url: 'http://url',
            appCacheTtl: 900,
        },
        () => ({ 200: t.string.decode, 400: E.right }),
        [200]
    )

    const storage = new MockWebStorage()

    const cachePool = cachePoolWebStorage({
        storage: storage,
        namespace: 'fetchCacheableFactory',
    })

    afterAll(() => {
        storage.clear()
        jest.clearAllTimers()
    })

    test('fetchCacheableFactory 200 no in cache', async () => {
        const logger = jest.fn()
        const ajaxMock = (() =>
            of({
                status: 200,
                response: 'hello',
            })) as any as typeof ajax

        const r = await lastValueFrom(ROR({ ajax: ajaxMock, logger, cachePool, session: 'session' }))

        expect(r).toStrictEqual({ _tag: 'done', data: { status: 200, payload: 'hello' } })

        expect(storage.length).toBe(1)
        expect(storage.getItem('fetchCacheableFactory_session_key')).not.toBeNull()
        expect(logger.mock.calls.length).toBe(0)
    })

    test('fetchCacheableFactory 200 in cache', async () => {
        jest.useFakeTimers('modern').setSystemTime(systemTime)

        storage.setItem(
            'fetchCacheableFactory_session_key',
            JSON.stringify({
                validUntil: systemTime + 20 * 1000,
                item: {
                    status: 200,
                    payload: 'hello',
                },
            })
        )

        const logger = jest.fn()
        const ajaxMock = (() =>
            of({
                status: 200,
                response: 'hello',
            })) as any as typeof ajax

        const r = await lastValueFrom(ROR({ ajax: ajaxMock, logger, cachePool, session: 'session' }))

        expect(r).toStrictEqual({ _tag: 'done', data: { status: 200, payload: 'hello' } })

        expect(storage.length).toBe(1)
        expect(storage.getItem('fetchCacheableFactory_session_key')).not.toBeNull()
        expect(logger.mock.calls.length).toBe(0)
    })

    test('fetchCacheableFactory 200 in cache decode fail', async () => {
        jest.useFakeTimers('modern').setSystemTime(systemTime)

        storage.setItem(
            'fetchCacheableFactory_session_key',
            JSON.stringify({
                validUntil: systemTime + 20 * 1000,
                item: {
                    status: 200,
                    payload: 1,
                },
            })
        )

        const logger = jest.fn()
        const ajaxMock = (() =>
            of({
                status: 200,
                response: 'hello',
            })) as any as typeof ajax

        const r = await lastValueFrom(ROR({ ajax: ajaxMock, logger, cachePool, session: 'session' }))

        expect(r).toStrictEqual({ _tag: 'done', data: { status: 200, payload: 'hello' } })

        expect(storage.length).toBe(1)
        expect(storage.getItem('fetchCacheableFactory_session_key')).not.toBeNull()
        expect(storage.getItem('fetchCacheableFactory_session_key')).toStrictEqual(
            JSON.stringify({
                validUntil: systemTime + 900 * 1000,
                item: {
                    status: 200,
                    payload: 'hello',
                },
            })
        )
        expect(logger.mock.calls.length).toBe(0)
    })
})

describe('resourceFetchFactory fetchCacheableFactory with no appCacheTtl', () => {
    interface cacheDeps {
        session: string
    }

    const ff = RESFF.fetchCacheableFactory({
        loggerFail: logError,
        createCacheKey: () => (d: cacheDeps) => `${d.session}_key`,
    })
    const ROR = ff(
        {
            method: 'GET',
            url: 'http://url',
        },
        () => ({ 200: t.string.decode, 400: E.right }),
        [200]
    )

    const storage = new MockWebStorage()

    const cachePool = cachePoolWebStorage({
        storage: storage,
        namespace: 'fetchCacheableFactory',
    })

    afterAll(() => {
        storage.clear()
    })

    test('fetchCacheableFactory 200 no in cache', async () => {
        const logger = jest.fn()
        const ajaxMock = (() =>
            of({
                status: 200,
                response: 'hello',
            })) as any as typeof ajax

        const r = await lastValueFrom(ROR({ ajax: ajaxMock, logger, cachePool, session: 'session' }))

        expect(r).toStrictEqual({ _tag: 'done', data: { status: 200, payload: 'hello' } })

        expect(storage.length).toBe(0)
        expect(storage.getItem('fetchCacheableFactory_key')).toBeNull()
        expect(logger.mock.calls.length).toBe(0)
    })
})
