import { hashString } from '../../src/utility/hash'

describe('hash', () => {
    test('hashString', () => {
        const a = hashString('https://hello')
        const b = hashString('https://hello')

        expect(a).toBe(b)
    })

    test('hashString', () => {
        const a = hashString('https://hello')
        const b = hashString('https://hello/1')

        expect(a).not.toBe(b)
    })

    test('hashString', () => {
        const a = hashString('')
        const b = hashString('')

        expect(a).toBe(b)
    })
})
