import * as fc from 'fast-check'
import * as laws from 'fp-ts-laws'
import { pipe } from 'fp-ts/function'
import * as Eq from 'fp-ts/lib/Eq'
import * as _ from '../../src/http/Resource'

describe('resource', () => {
    describe('pipeables', () => {
        test('map', () => {
            const f = (s: string): number => s.length

            expect(pipe(_.done('abc'), _.map(f))).toStrictEqual(_.done(3))
            expect(pipe(_.fail('s'), _.map(f))).toStrictEqual(_.fail('s'))
        })
    })

    describe('laws', () => {
        test('Functor', () => {
            laws.functor(_.resource)(
                a => getResource(fc.string(), a),
                Eqa => _.getEq(Eq.eqString, Eqa)
            )
        })

        test('Apply', () => {
            laws.apply(_.resource)(
                a => getResource(fc.string(), a),
                Eqa => _.getEq(Eq.eqString, Eqa)
            )
        })

        test('Applicative', () => {
            laws.applicative(_.resource)(
                a => getResource(fc.string(), a),
                Eqa => _.getEq(Eq.eqString, Eqa)
            )
        })

        test('Monad', () => {
            laws.monad(_.resource)(Eqa => _.getEq(Eq.eqString, Eqa))
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

    test('resourceFold', () => {
        const onInit = jest.fn()
        const onDone = jest.fn()
        const onSubmitted = jest.fn()
        const onfail = jest.fn()

        const c = {
            onInit: onInit,
            onDone: onDone,
            onSubmitted: onSubmitted,
            onFail: onfail,
        }

        const ts: [_.ResourceTypeOf<{ 200: any }>, jest.Mock<any, any>][] = [
            [_.init, onInit],
            [_.submitted, onSubmitted],
            [_.done({ status: 200, payload: 'hello' }), onDone],
            [_.fail({ type: 'unknownError', detail: 'boom' }), onfail],
        ]

        ts.forEach(([r, m]) => {
            pipe(r, _.resourceMatch(c))
            expect(m.mock.calls.length).toBe(1)
            jest.resetAllMocks()
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
