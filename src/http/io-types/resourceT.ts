import * as t from 'io-ts'
import type * as RES from '../Resource'

const initLiteral = t.literal('init')
const submittedLiteral = t.literal('submitted')
const failLiteral = t.literal('fail')
const doneLiteral = t.literal('done')

export type ResourceC<E extends t.Mixed, A extends t.Mixed> = t.Type<
    RES.Resource<t.TypeOf<E>, t.TypeOf<A>>,
    RES.Resource<t.OutputOf<E>, t.OutputOf<A>>,
    unknown
>

export function resourceT<F extends t.Mixed, D extends t.Mixed>(
    failCodec: F,
    doneCodec: D,
    name = `Resource<${failCodec.name}, ${doneCodec.name}>`
): ResourceC<F, D> {
    return t.union(
        [
            t.strict({ _tag: initLiteral }),
            t.strict({ _tag: submittedLiteral }),
            t.strict(
                {
                    _tag: failLiteral,
                    error: failCodec,
                },
                `Fail<${failCodec.name}>`
            ),
            t.strict(
                {
                    _tag: doneLiteral,
                    data: doneCodec,
                },
                `Right<${doneCodec.name}>`
            ),
        ],
        name
    )
}
