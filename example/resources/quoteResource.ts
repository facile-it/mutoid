import * as R from 'fp-ts/lib/Reader'
import { pipe } from 'fp-ts/lib/function'
import * as t from 'io-ts'
import type { AjaxCreationMethod } from 'rxjs/internal/observable/dom/AjaxObservable'
import { delay } from 'rxjs/operators'
import { Resource, ajaxToResource } from '../../src/http'
import { authAppError, fetchWithAuth } from './fetchWithAuth'

export const quoteDecoders = {
    200: t.array(t.string).decode,
    400: t.string.decode,
}

export type quoteResource = Resource<typeof quoteDecoders, authAppError>

// example: if you need token in some store
// you can write a function like: fetchWithAuth

export const fetchQuote = pipe(
    R.asks(fetchWithAuth),
    R.chainW(builder =>
        R.asks((deps: { ajax: AjaxCreationMethod }) =>
            builder(
                () => token => deps.ajax(`https://ron-swanson-quotes.herokuapp.com/v2/quotes?token=${token}`),
                quoteDecoders
            )
        )
    )
)

// example: simple fetch without token but with params

export const fetchQuoteWithParams = R.asks((deps: { ajax: AjaxCreationMethod }) => (id: number, from: string) =>
    ajaxToResource(deps.ajax(`https://ron-swanson-quotes.herokuapp.com/v2/quotes?id=${id}&from=${from}`), quoteDecoders)
)

// example: example with compoosition

export const fetchQuoteWithDelay = pipe(
    R.asks(fetchWithAuth),
    R.chainW(builder =>
        R.asks((deps: { ajax: AjaxCreationMethod }) =>
            builder(
                () => token =>
                    deps.ajax(`https://ron-swanson-quotes.herokuapp.com/v2/quotes?token=${token}`).pipe(delay(5000)),
                quoteDecoders
            )
        )
    )
)
