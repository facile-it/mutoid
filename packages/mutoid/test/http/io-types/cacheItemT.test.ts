import { right } from 'fp-ts/Either'
import * as t from 'io-ts'
import { cacheItemT, cacheItemWithPayloadT } from '../../../src/http/io-types'

describe('cacheItemT and cacheItemWithPayloadT', () => {
    test('name', () => {
        const T = cacheItemWithPayloadT(t.string, 'T')
        expect(T.name).toBe('T')
    })

    test('is', () => {
        const T = cacheItemWithPayloadT(t.string)
        expect(T.is({ status: 200, payload: 'hello' })).toStrictEqual(true)
        expect(T.is({ status: 200, payload: 2 })).toStrictEqual(false)
    })

    test('decode', () => {
        const T = cacheItemWithPayloadT(t.string)
        expect(T.decode({ status: 200, payload: 'hello' })).toStrictEqual(right({ status: 200, payload: 'hello' }))
        expect(T.decode({ status: 1000, payload: 'hello' })._tag).toBe('Left')
    })

    test('encode', () => {
        const T = cacheItemWithPayloadT(t.string)
        expect(T.encode({ status: 200, payload: 'hello' })).toStrictEqual({ status: 200, payload: 'hello' })
        expect(cacheItemT.encode({ status: 200, payload: 'hello' })).toStrictEqual({ status: 200, payload: 'hello' })
    })
})
