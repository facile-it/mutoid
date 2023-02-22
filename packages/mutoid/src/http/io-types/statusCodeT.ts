import * as t from 'io-ts'
import { StatusCode, StatusCodeMap, statusPredicate } from '../statusCode'

const allStatusPredicate = statusPredicate(StatusCodeMap)
const allStatusPredicateWithZero = (u: unknown): u is StatusCode | 0 => allStatusPredicate(u) || u === 0

export interface StatusCodeC extends t.Type<StatusCode, string | number, unknown> {}

export const statusCodeT: StatusCodeC = new t.Type<StatusCode, string | number, unknown>(
    'StatusCode',
    allStatusPredicate,
    (u, c) => (allStatusPredicate(u) ? t.success(u) : t.failure(u, c)),
    Number
)

export interface StatusCodeWithZeroC extends t.Type<StatusCode | 0, string | number, unknown> {}

export const statusCodeWithZeroT: StatusCodeWithZeroC = new t.Type<StatusCode | 0, string | number, unknown>(
    'StatusCodeWithZero',
    allStatusPredicateWithZero,
    (u, c) => (allStatusPredicateWithZero(u) ? t.success(u) : t.failure(u, c)),
    Number
)
