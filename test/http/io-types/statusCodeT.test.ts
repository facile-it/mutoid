import { right } from 'fp-ts/Either'
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

    test('decode statusCodeT', () => {
        const T = statusCodeT

        expect(T.decode(200)).toStrictEqual(right(200))
        expect(T.decode(0)._tag).toBe('Left')
        expect(T.decode(1000)._tag).toBe('Left')
    })

    test('decode statusCodeWithZeroT', () => {
        const T = statusCodeWithZeroT

        expect(T.decode(200)).toStrictEqual(right(200))
        expect(T.decode(0)).toStrictEqual(right(0))
        expect(T.decode(1000)._tag).toBe('Left')
    })
})
