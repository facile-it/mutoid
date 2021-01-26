import * as R from 'fp-ts/Reader'
import { pipe } from 'fp-ts/function'
import * as t from 'io-ts'
import { nonEmptyArray } from 'io-ts-types/nonEmptyArray'
import type { ajax } from 'rxjs/ajax'
import { delay } from 'rxjs/operators'
import * as RR from '../../src/http/ObservableResource'
import type * as RES from '../../src/http/Resource'
import { authAppError, fetchWithAuth } from './fetchWithAuth'

export const quoteDecoders = {
    200: nonEmptyArray(t.string).decode,
    400: t.string.decode,
}

export type quoteResource = RES.ResourceTypeOf<typeof quoteDecoders, authAppError>

// example: if you need token in some store
// you can write a function like: fetchWithAuth

export const fetchQuote = pipe(
    fetchWithAuth,
    R.chainW(builder => (deps: { ajax: typeof ajax }) => () =>
        builder(token => deps.ajax(`https://ron-swanson-quotes.herokuapp.com/v2/quotes?token=${token}`), quoteDecoders)
    )
)

// example: simple fetch without token but with params

export const fetchQuoteWithParams = (deps: { ajax: typeof ajax }) => (id: number, from: string) =>
    RR.fromAjax(deps.ajax(`https://ron-swanson-quotes.herokuapp.com/v2/quotes?id=${id}&from=${from}`), quoteDecoders)

// example: with auth

export const fetchQuoteWithDelay = pipe(
    fetchWithAuth,
    R.chainW(builder => (deps: { ajax: typeof ajax }) => () =>
        builder(
            token => deps.ajax(`https://ron-swanson-quotes.herokuapp.com/v2/quotes?token=${token}`).pipe(delay(5000)),
            quoteDecoders
        )
    )
)
