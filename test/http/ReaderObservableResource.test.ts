import { pipe } from 'fp-ts/function'
import { firstValueFrom } from 'rxjs'
import * as _ from '../../src/http/ReaderObservableResource'
import * as RES from '../../src/http/Resource'

describe('ReaderObservableResource', () => {
    describe('type class members', () => {
        const length = (s: string): number => s.length
        const lengthR = (s: string): _.ReaderObservableResource<never, string, number> => _.done(s.length)
        const double = (n: number): number => n * 2

        const run = <E, A>(ror: _.ReaderObservableResource<never, E, A>) => firstValueFrom(ror({} as never))

        test('map', async () => {
            expect(await run(pipe(_.done('abc'), _.map(length)))).toStrictEqual(RES.done(3))
            expect(await run(pipe(_.fail('s'), _.map(length)))).toStrictEqual(RES.fail('s'))
        })

        test('bimap', async () => {
            expect(await run(pipe(_.init, _.bimap(double, length)))).toStrictEqual(RES.init)
            expect(await run(pipe(_.submitted, _.bimap(double, length)))).toStrictEqual(RES.submitted)
            expect(await run(pipe(_.done('abc'), _.bimap(double, length)))).toStrictEqual(RES.done(3))
            expect(await run(pipe(_.fail(1), _.bimap(double, length)))).toStrictEqual(RES.fail(2))
        })

        test('mapLeft', async () => {
            expect(await run(pipe(_.done('abc'), _.mapLeft(double)))).toStrictEqual(RES.done('abc'))
            expect(await run(pipe(_.fail(1), _.mapLeft(double)))).toStrictEqual(RES.fail(2))
        })

        test('ap', async () => {
            expect(await run(pipe(_.done(length), _.ap(_.done('abc'))))).toStrictEqual(RES.done(3))
            expect(await run(pipe(_.done(length), _.ap(_.fail('maError'))))).toStrictEqual(RES.fail('maError'))
        })

        test('chain', async () => {
            expect(await run(pipe(_.done('abc'), _.chain(lengthR)))).toStrictEqual(RES.done(3))
            expect(await run(pipe(_.fail<string, string>('maError'), _.chain(lengthR)))).toStrictEqual(
                RES.fail('maError')
            )
        })
    })

    test('do notation', async () => {
        expect(
            await firstValueFrom(
                pipe(
                    _.done<string, string, number>(1),
                    _.bindTo('a'),
                    _.bind('b', () => _.done('b'))
                )('hello')
            )
        ).toStrictEqual(RES.done({ a: 1, b: 'b' }))
    })
})
