import { right } from 'fp-ts/Either'
import { cachePoolItemT } from '../../../src/http/io-types'

describe('cachePoolItemT', () => {
    test('is', () => {
        const T = cachePoolItemT
        expect(T.is({ validUntil: 1, item: { status: 200, payload: 'hello' } })).toStrictEqual(true)
        expect(T.is({ validUntil: 1, item: { status: 1000, payload: 'hello' } })).toStrictEqual(false)
    })

    test('decode', () => {
        const T = cachePoolItemT
        expect(T.decode({ validUntil: 1, item: { status: 200, payload: 'hello' } })).toStrictEqual(
            right({ validUntil: 1, item: { status: 200, payload: 'hello' } })
        )
        expect(T.decode({ validUntil: 1, item: { status: 1000, payload: 'hello' } })._tag).toBe('Left')
    })

    test('encode', () => {
        const T = cachePoolItemT
        expect(T.encode({ validUntil: 1, item: { status: 200, payload: 'hello' } })).toStrictEqual({
            validUntil: 1,
            item: { status: 200, payload: 'hello' },
        })
    })
})
