import * as fc from 'fast-check'
import { pipe } from 'fp-ts/function'
import * as String from 'fp-ts/string'
import * as laws from 'fp-ts-laws'
import * as _ from '../../src/http/Resource'

describe('Resource', () => {
    describe('type class members', () => {
        const length = (s: string): number => s.length
        const lengthR = (s: string): _.Resource<string, number> => _.done(s.length)
        const double = (n: number): number => n * 2

        test('map', () => {
            expect(pipe(_.done('abc'), _.map(length))).toStrictEqual(_.done(3))
            expect(pipe(_.fail('s'), _.map(length))).toStrictEqual(_.fail('s'))
        })

        test('bimap', () => {
            expect(pipe(_.init, _.bimap(double, length))).toStrictEqual(_.init)
            expect(pipe(_.submitted, _.bimap(double, length))).toStrictEqual(_.submitted)
            expect(pipe(_.done('abc'), _.bimap(double, length))).toStrictEqual(_.done(3))
            expect(pipe(_.fail(1), _.bimap(double, length))).toStrictEqual(_.fail(2))
        })

        test('mapLeft', () => {
            expect(pipe(_.done('abc'), _.mapLeft(double))).toStrictEqual(_.done('abc'))
            expect(pipe(_.fail(1), _.mapLeft(double))).toStrictEqual(_.fail(2))
        })

        test('ap', () => {
            expect(pipe(_.done(length), _.ap(_.done('abc')))).toStrictEqual(_.done(3))
            expect(pipe(_.done(length), _.ap(_.fail('maError')))).toStrictEqual(_.fail('maError'))
        })

        test('chain', () => {
            expect(pipe(_.done('abc'), _.chain(lengthR))).toStrictEqual(_.done(3))
            expect(pipe(_.fail<string, string>('maError'), _.chain(lengthR))).toStrictEqual(_.fail('maError'))
        })
    })

    describe('combinators', () => {
        test('swap', () => {
            expect(_.swap(_.init)).toStrictEqual(_.init)
            expect(_.swap(_.submitted)).toStrictEqual(_.submitted)
            expect(_.swap(_.done('a'))).toStrictEqual(_.fail('a'))
            expect(_.swap(_.fail('b'))).toStrictEqual(_.done('b'))
        })

        test('orElse', () => {
            expect(
                pipe(
                    _.done(1),
                    _.orElse(() => _.done(2))
                )
            ).toStrictEqual(_.done(1))
            expect(
                pipe(
                    _.done(1),
                    _.orElse(() => _.fail('foo'))
                )
            ).toStrictEqual(_.done(1))
            expect(
                pipe(
                    _.fail('a'),
                    _.orElse(() => _.done(1))
                )
            ).toStrictEqual(_.done(1))
            expect(
                pipe(
                    _.fail('a'),
                    _.orElse(() => _.fail('b'))
                )
            ).toStrictEqual(_.fail('b'))
        })

        test('filterOrElse', () => {
            const gt10 = (n: number): boolean => n > 10
            expect(
                pipe(
                    _.done(12),
                    _.filterOrElse(gt10, () => -1)
                )
            ).toStrictEqual(_.done(12))
            expect(
                pipe(
                    _.done(7),
                    _.filterOrElse(gt10, () => -1)
                )
            ).toStrictEqual(_.fail(-1))
            expect(
                pipe(
                    _.fail(12),
                    _.filterOrElse(gt10, () => -1)
                )
            ).toStrictEqual(_.fail(12))
            expect(
                pipe(
                    _.done(7),
                    _.filterOrElse(gt10, n => `invalid ${n}`)
                )
            ).toStrictEqual(_.fail('invalid 7'))
        })
    })

    describe('laws', () => {
        test('Functor', () => {
            laws.functor(_.Functor)(
                a => getResource(fc.string(), a),
                Eqa => _.getEq(String.Eq, Eqa)
            )
        })

        test('Apply', () => {
            laws.apply(_.Apply)(
                a => getResource(fc.string(), a),
                Eqa => _.getEq(String.Eq, Eqa)
            )
        })

        test('Applicative', () => {
            laws.applicative(_.Applicative)(
                a => getResource(fc.string(), a),
                Eqa => _.getEq(String.Eq, Eqa)
            )
        })

        test('Monad', () => {
            laws.monad(_.Monad)(Eqa => _.getEq(String.Eq, Eqa))
        })
    })

    test('guards', () => {
        const init = _.init
        const submitted = _.submitted
        const done = _.done<never, _.ResourceData<200, string>>({ status: 200, payload: 'hello' })
        const fail = _.fail({ type: 'unknownError', detail: 'boom' })

        expect(_.isInit(init)).toBe(true)
        expect(_.isPending(init)).toBe(true)
        expect(_.isStarted(init)).toBe(false)
        expect(_.isAcknowledged(init)).toBe(false)

        expect(_.isSubmitted(submitted)).toBe(true)
        expect(_.isPending(submitted)).toBe(true)
        expect(_.isStarted(submitted)).toBe(true)
        expect(_.isAcknowledged(submitted)).toBe(false)

        expect(_.isDone(done)).toBe(true)
        expect(_.isPending(done)).toBe(false)
        expect(_.isStarted(done)).toBe(true)
        expect(_.isAcknowledged(done)).toBe(true)

        expect(_.isFail(fail)).toBe(true)
        expect(_.isPending(fail)).toBe(false)
        expect(_.isStarted(fail)).toBe(true)
        expect(_.isAcknowledged(fail)).toBe(true)

        expect(_.isInit(submitted)).toBe(false)
        expect(_.isSubmitted(init)).toBe(false)
        expect(_.isDone(init)).toBe(false)
        expect(_.isFail(init)).toBe(false)
    })

    test('match', () => {
        const onInit = jest.fn()
        const onDone = jest.fn()
        const onSubmitted = jest.fn()
        const onFail = jest.fn()

        const c = { onInit, onDone, onSubmitted, onFail }

        const ts: [_.ResourceTypeOf<{ 200: any }>, jest.Mock<any, any>][] = [
            [_.init, onInit],
            [_.submitted, onSubmitted],
            [_.done({ status: 200, payload: 'hello' }), onDone],
            [_.fail({ type: 'unknownError', detail: 'boom' }), onFail],
        ]

        ts.forEach(([r, m]) => {
            pipe(r, _.matchD(c))
            expect(m.mock.calls.length).toBe(1)
            jest.resetAllMocks()
        })

        ts.forEach(([r, m]) => {
            _.match_(r)(onInit, onSubmitted, onDone, onFail)
            expect(m.mock.calls.length).toBe(1)
            jest.resetAllMocks()
        })
    })

    test('match pending', () => {
        const onPending = jest.fn()
        const onDone = jest.fn()
        const onFail = jest.fn()

        const c = { onPending, onDone, onFail }

        pipe(_.submitted, _.matchD(c))
        expect(onPending.mock.calls.length).toBe(1)
        expect(onDone.mock.calls.length).toBe(0)
        expect(onFail.mock.calls.length).toBe(0)
        jest.resetAllMocks()

        pipe(_.init, _.matchD(c))
        expect(onPending.mock.calls.length).toBe(1)
        expect(onDone.mock.calls.length).toBe(0)
        expect(onFail.mock.calls.length).toBe(0)
        jest.resetAllMocks()
    })

    describe('getShow', () => {
        test('show', () => {
            const S = _.getShow(String.Show, String.Show)
            expect(S.show(_.init)).toStrictEqual('init')
            expect(S.show(_.submitted)).toStrictEqual('submitted')
            expect(S.show(_.fail('a'))).toStrictEqual(`fail("a")`)
            expect(S.show(_.done('a'))).toStrictEqual(`done("a")`)
        })
    })

    describe('getEq', () => {
        test('eq', () => {
            const S = _.getEq(String.Eq, String.Eq)

            expect(S.equals(_.init, _.init)).toStrictEqual(true)
            expect(S.equals(_.init, _.submitted)).toStrictEqual(false)
            expect(S.equals(_.submitted, _.submitted)).toStrictEqual(true)
            expect(S.equals(_.submitted, _.init)).toStrictEqual(false)

            expect(S.equals(_.done('1'), _.done('1'))).toStrictEqual(true)

            expect(S.equals(_.fail('1'), _.fail('1'))).toStrictEqual(true)
        })
    })
})

function getInit<L, A>(arb: fc.Arbitrary<unknown>): fc.Arbitrary<_.Resource<L, A>> {
    return arb.map(() => _.init)
}

function getSubmitted<L, A>(arb: fc.Arbitrary<unknown>): fc.Arbitrary<_.Resource<L, A>> {
    return arb.map(() => _.submitted)
}

function getFailure<L, A>(arb: fc.Arbitrary<L>): fc.Arbitrary<_.Resource<L, A>> {
    return arb.map(a => _.fail(a))
}

function getSuccess<L, A>(arb: fc.Arbitrary<A>): fc.Arbitrary<_.Resource<L, A>> {
    return arb.map(a => _.done(a))
}

export function getResource<L, A>(leftArb: fc.Arbitrary<L>, rightArb: fc.Arbitrary<A>): fc.Arbitrary<_.Resource<L, A>> {
    return fc.oneof<fc.Arbitrary<_.Resource<L, A>>[]>(
        getInit(rightArb),
        getSubmitted(rightArb),
        getFailure(leftArb),
        getSuccess(rightArb)
    )
}
