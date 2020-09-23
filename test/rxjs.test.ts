import * as IO from 'fp-ts/IO'
import { of } from 'rxjs'
import * as MRX from '../src/rxjs'

describe('rxjs', () => {
    test('chainFirstIO', () => {
        const o = of(1).pipe(MRX.chainFirstIO((uno: number) => IO.of(uno + 2)))

        const n = jest.fn()

        o.subscribe(n)

        expect(n).toBeCalledTimes(1)
        expect(n).toBeCalledWith(1)
    })

    test('chainIOK', () => {
        const o = of(1).pipe(MRX.chainIOK((uno: number) => IO.of(uno + 2)))

        const n = jest.fn()

        o.subscribe(n)

        expect(n).toBeCalledTimes(1)
        expect(n).toBeCalledWith(3)
    })

    test('chainIOK', () => {
        const o = of(1, 2).pipe(MRX.chainIOK((nn: number) => IO.of(nn + 2)))

        const n = jest.fn()

        o.subscribe(n)

        expect(n).toBeCalledTimes(2)
        expect(n).toHaveBeenNthCalledWith(1, 3)
        expect(n).toHaveBeenNthCalledWith(2, 4)
    })
})
