import { statusCodeT, statusCodeWithZeroT } from '../../../src/http/io-types'

describe('statusCodeT', () => {
    test('is statusCodeT', () => {
        const T = statusCodeT
        expect(T.is(200)).toStrictEqual(true)
        expect(T.is(500)).toStrictEqual(true)
        expect(T.is(300)).toStrictEqual(true)
        expect(T.is(1000)).toStrictEqual(false)
        expect(T.is(0)).toStrictEqual(false)
    })

    test('is statusCodeWithZeroT', () => {
        const T = statusCodeWithZeroT
        expect(T.is(200)).toStrictEqual(true)
        expect(T.is(500)).toStrictEqual(true)
        expect(T.is(300)).toStrictEqual(true)
        expect(T.is(0)).toStrictEqual(true)
        expect(T.is(1000)).toStrictEqual(false)
    })
})
