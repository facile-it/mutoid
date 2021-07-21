import { right } from 'fp-ts/Either'
import * as t from 'io-ts'
import * as RES from '../../../src/http/Resource'
import { resourceT } from '../../../src/http/io-types'

describe('resourceT', () => {
    test('name', () => {
        const T = resourceT(t.string, t.number, 'T')
        expect(T.name).toBe('T')
    })

    test('is', () => {
        const T = resourceT(t.string, t.number)
        expect(T.is(RES.done(1))).toStrictEqual(true)
        expect(T.is(RES.done('foo'))).toStrictEqual(false)
        expect(T.is(RES.fail(1))).toStrictEqual(false)
        expect(T.is(RES.fail('foo'))).toStrictEqual(true)
    })

    test('decode', () => {
        const T = resourceT(t.string, t.number)
        expect(T.decode({ _tag: 'init' })).toStrictEqual(right(RES.init))
        expect(T.decode({ _tag: 'submitted' })).toStrictEqual(right(RES.submitted))
        expect(T.decode({ _tag: 'fail', error: 's' })).toStrictEqual(right(RES.fail<string, number>('s')))
        expect(T.decode({ _tag: 'done', data: 1 })).toStrictEqual(right(RES.done<string, number>(1)))
    })

    test('encode', () => {
        const T = resourceT(t.string, t.number)
        expect(T.encode(RES.fail('a'))).toStrictEqual({ _tag: 'fail', error: 'a' })
        expect(T.encode(RES.done(1))).toStrictEqual({ _tag: 'done', data: 1 })
    })
})
