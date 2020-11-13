import * as R from 'fp-ts/Reader'
import { pipe } from 'fp-ts/function'
import * as t from 'io-ts'
import { nonEmptyArray } from 'io-ts-types/nonEmptyArray'
import type { ajax } from 'rxjs/ajax'
import { delay } from 'rxjs/operators'
import * as MH from '../../src/http'
import { authAppError, fetchWithAuth } from './fetchWithAuth'

export const quoteDecoders = {
    200: nonEmptyArray(t.string).decode,
    400: t.string.decode,
}

export type quoteResource = MH.Resource<typeof quoteDecoders, authAppError>

// example: if you need token in some store
// you can write a function like: fetchWithAuth

export const fetchQuote = pipe(
    R.asks(fetchWithAuth),
    R.chainW(fetch =>
        R.asks((deps: { ajax: typeof ajax }) => () =>
            fetch(
                token => deps.ajax(`https://ron-swanson-quotes.herokuapp.com/v2/quotes?token=${token}`),
                quoteDecoders
            )
        )
    )
)

// example: simple fetch without token but with params

export const fetchQuoteWithParams = R.asks((deps: { ajax: typeof ajax }) => (id: number, from: string) =>
    MH.ajaxToResource(
        deps.ajax(`https://ron-swanson-quotes.herokuapp.com/v2/quotes?id=${id}&from=${from}`),
        quoteDecoders
    )
)

// example: with composition

export const fetchQuoteWithDelay = pipe(
    R.asks(fetchWithAuth),
    R.chainW(builder =>
        R.asks((deps: { ajax: typeof ajax }) => () =>
            builder(
                token =>
                    deps.ajax(`https://ron-swanson-quotes.herokuapp.com/v2/quotes?token=${token}`).pipe(delay(5000)),
                quoteDecoders
            )
        )
    )
)
