import * as A from 'fp-ts/Array'
import * as O from 'fp-ts/Option'
import * as RE from 'fp-ts/Record'
import { pipe } from 'fp-ts/function'

function mapArray(k: string, a: Array<O.Option<string | number>>): Record<string, string> {
    return pipe(
        a,
        A.filter(O.isSome),
        A.map(v => v.value.toString()),
        A.reduce({}, (c, v) => ({
            ...c,
            [`${k}[]`]: v.toString(),
        }))
    )
}

export type OptionParams = Record<string, O.Option<string | number | Array<O.Option<string | number>>>>

export function serializeToQueryParams(p: OptionParams): string {
    return pipe(
        p,
        RE.filter(O.isSome),
        RE.reduceWithIndex(
            {} as Record<string, string>,
            (k, c, v): Record<string, string> =>
                Array.isArray(v.value) ? { ...c, ...mapArray(k, v.value) } : { ...c, [k]: v.value.toString() }
        ),
        RE.reduceWithIndex(new URLSearchParams(), (k, u, v) => {
            u.append(k, v)
            return u
        }),
        u => u.toString(),
        s => (s.length > 0 ? `?${s}` : '')
    )
}

export type NullableParams =
    | undefined
    | Record<string, undefined | null | string | number | Array<string | number | undefined | null>>

export function serializeNullableToQueryParams(p: NullableParams): string {
    return pipe(
        p || {},
        RE.map(O.fromNullable),
        RE.map(O.map(v => (Array.isArray(v) ? v.map(O.fromNullable) : v))),
        serializeToQueryParams
    )
}
