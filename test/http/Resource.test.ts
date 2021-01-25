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
