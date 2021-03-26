import { serializeNullableToFormData } from '../../src/http/serializeToFormData'

describe('serializeToFormData', () => {
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
            // p: {
            //     q: 1,
            // },
        },
        r: null,
        s: {
            t: undefined,
            u: 1,
        },
    }

    test('Test method serializeToFormData', () => {
        const formData = serializeNullableToFormData(data)

        const result = [
            [formData.get('a'), '1'],
            [formData.get('b'), 'test'],
            [formData.get('c'), 'true'],
            [formData.get('d'), 'false'],
            [formData.getAll('e[]'), ['1', '2', '3']],
            [formData.get('f[0][g]'), '1'],
            [formData.get('f[1][g]'), '3'],
            [formData.get('f[1][h]'), '4'],
            [formData.get('i[0][0][k]'), '2'],
            [formData.get('i[0][1][j]'), '3'],
            [formData.get('l[m]'), '1'],
            [formData.get('l[n]'), 'test'],
            [formData.getAll('l[o][]'), ['1', '2', '3']],
            // [formData.get('l[p][q]'), '1'],
            [formData.has('r'), false],
            [formData.has('s[t]'), false],
            [formData.has('s[u]'), true],
            [formData.get('s[u]'), '1'],
        ]

        result.map(d => expect(d[0]).toEqual(d[1]))
    })
})
