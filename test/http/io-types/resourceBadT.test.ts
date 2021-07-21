import { resourceBadT } from '../../../src/http/io-types'

describe('resourceBadT', () => {
    test('is', () => {
        const T = resourceBadT
        expect(
            T.is({ type: 'rejected', error: 'notFound', errorMessage: 'hello', statusCode: 0, detail: 'hello' })
        ).toStrictEqual(true)
        expect(
            T.is({ type: 'fail', error: 'networkError', errorMessage: 'hello', statusCode: 0, detail: 'hello' })
        ).toStrictEqual(true)
        expect(
            T.is({ type: 'fail', error: 'networkError', errorMessage: 'hello', statusCode: 200, detail: 'hello' })
        ).toStrictEqual(true)
        expect(
            T.is({
                type: 'rejected',
                error: 'networkError',
                errorMessage: 'hello',
                statusCode: 200,
                detail: 'hello',
            })
        ).toStrictEqual(false)
        expect(
            T.is({ type: 'fail', error: 'networkError', errorMessage: 'hello', statusCode: 1000, detail: 'hello' })
        ).toStrictEqual(false)
    })
})
