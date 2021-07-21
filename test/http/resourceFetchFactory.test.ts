import * as E from 'fp-ts/Either'
import * as R from 'fp-ts/Reader'
import * as t from 'io-ts'
import { of, throwError } from 'rxjs'
import type { ajax } from 'rxjs/ajax'
import * as RESFF from '../../src/http/resourceFetchFactory'

function logError<E extends { error: string }>(e: E): R.Reader<{ logger: (e: string) => void }, void> {
    return R.asks<{ logger: (e: string) => void }, void>(({ logger }) => {
        logger(e.error)
    })
}

describe('resourceFetchFactory', () => {
    const ff = RESFF.fetchFactory(logError)
    const ROR = ff(
        {
            method: 'GET',
            url: 'http://url',
        },
        () => ({ 200: t.string.decode, 400: E.right }),
        [200]
    )

    test('fetchFactory 200 ', async () => {
        const logger = jest.fn()
        const ajaxMock = ((() =>
            of({
                status: 200,
                response: 'hello',
            })) as any) as typeof ajax
        const r = await ROR({ ajax: ajaxMock, logger }).toPromise()
        expect(r).toStrictEqual({ _tag: 'done', data: { status: 200, payload: 'hello' } })
        expect(logger.mock.calls.length).toBe(0)
    })

    test('fetchFactory 400 ', async () => {
        const logger = jest.fn()

        const ajaxMock = ((() =>
            of({
                status: 400,
                response: 'any response',
            })) as any) as typeof ajax
        const r = await ROR({ ajax: ajaxMock, logger }).toPromise()

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

        const ajaxMock = ((() =>
            of({
                status: 500,
                response: 'any response',
            })) as any) as typeof ajax
        const r = await ROR({ ajax: ajaxMock, logger }).toPromise()

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

        const ajaxMock = ((() =>
            of({
                status: 0,
                response: 'any response',
            })) as any) as typeof ajax
        const r = await ROR({ ajax: ajaxMock, logger }).toPromise()

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

        const ajaxMock = ((() => throwError('hello error')) as any) as typeof ajax
        const r = await ROR({ ajax: ajaxMock, logger }).toPromise()

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
        const ajaxMock = ((() =>
            of({
                status: 200,
                response: 1,
            })) as any) as typeof ajax
        const r = await ROR({ ajax: ajaxMock, logger }).toPromise()

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
