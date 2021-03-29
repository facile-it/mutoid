import * as O from 'fp-ts/Option'
import { pipe } from 'fp-ts/function'
import * as _ from '../../src/http/dataSerializer'

describe('dataSerializer', () => {
    const data = {
        a: 1,
        b: 'test',
        c: true,
        d: false,
        e: [1, 2, 3],
        f: [
            { g: 1, h: 2 },
            { g: 3, h: 4 },
        ],
        i: [
            [
                { j: 1, k: 2 },
                { j: 3, k: 4 },
            ],
        ],
        l: {
            m: 1,
            n: 'test',
            o: [1, 2, 3],
            p: {
                q: 1,
            },
        },
        r: null,
        s: {
            t: undefined,
            u: 1,
            v: {
                z: 2,
                aa: {
                    bb: 'hello',
                },
            },
        },
    }

    const makeResult = (c: {
        get(name: string): FormDataEntryValue | null
        getAll(name: string): FormDataEntryValue[]
        has(name: string): boolean
    }) => {
        return [
            [c.get('a'), '1'],
            [c.get('b'), 'test'],
            [c.get('c'), 'true'],
            [c.get('d'), 'false'],
            [c.getAll('e[]'), ['1', '2', '3']],
            [c.get('f[0][g]'), '1'],
            [c.get('f[1][g]'), '3'],
            [c.get('f[1][h]'), '4'],
            [c.get('i[0][0][k]'), '2'],
            [c.get('i[0][1][j]'), '3'],
            [c.get('l[m]'), '1'],
            [c.get('l[n]'), 'test'],
            [c.getAll('l[o][]'), ['1', '2', '3']],
            [c.get('l[p][q]'), '1'],
            [c.has('r'), false],
            [c.has('s[t]'), false],
            [c.has('s[u]'), true],
            [c.get('s[u]'), '1'],
            [c.get('s[v][z]'), '2'],
            [c.get('s[v][aa][bb]'), 'hello'],
        ]
    }

    test('serializeNullableForm', () => {
        makeResult(_.serializeNullableForm(new FormData())(data)).map(d => expect(d[0]).toEqual(d[1]))
    })

    test('serializeNullableUrl', () => {
        makeResult(_.serializeNullableUrl(new URLSearchParams())(data)).map(d => expect(d[0]).toEqual(d[1]))
    })

    const dataOption = {
        a: O.some(1),
        b: 'test',
        c: O.some(true),
        d: [1, 2, 3],
        e: O.some({
            a: O.some('1'),
        }),
        f: [O.none, O.some('hello')],
        g: {
            a: O.some(1),
        },
        h: O.none,
    }

    const makeOptionResult = (c: {
        get(name: string): FormDataEntryValue | null
        getAll(name: string): FormDataEntryValue[]
        has(name: string): boolean
    }) => {
        return [
            [c.get('a'), '1'],
            [c.get('b'), 'test'],
            [c.get('c'), 'true'],
            [c.getAll('d[]'), ['1', '2', '3']],
            [c.get('e[a]'), '1'],
            [c.getAll('f[]'), ['hello']],
            [c.get('g[a]'), '1'],
            [c.has('h'), false],
        ]
    }

    test('serializeForm', () => {
        makeOptionResult(_.serializeForm(new FormData())(dataOption)).map(d => expect(d[0]).toEqual(d[1]))
    })

    test('serializeUrl', () => {
        makeOptionResult(_.serializeUrl(new URLSearchParams())(dataOption)).map(d => expect(d[0]).toEqual(d[1]))
    })

    test('toQueryString', () => {
        const result = pipe({ a: '1', b: 2 }, _.serializeUrl(new URLSearchParams()), _.toQueryString)
        expect(result).toEqual('?a=1&b=2')
    })

    test('toQueryString empty', () => {
        const result = pipe({}, _.serializeUrl(new URLSearchParams()), _.toQueryString)
        expect(result).toEqual('')
    })
})
