import * as t from 'io-ts'
import { Resource } from '../../src/http'
import { ajax } from 'rxjs/ajax'
import { authAppError, fetchWithAuth } from './fetchWithAuth'
import { delay } from 'rxjs/operators'

export const quoteDecoders = {
    200: t.array(t.string).decode,
    400: t.string.decode,
}

export type quoteResource = Resource<typeof quoteDecoders, authAppError>

export const fetchQuote = fetchWithAuth(
    () => t => ajax('https://ron-swanson-quotes.herokuapp.com/v2/quotes' + `?token=${t}`),
    quoteDecoders
)

export const fetchQuoteWithParams = fetchWithAuth(
    (id: number, from: string) => t =>
        ajax('https://ron-swanson-quotes.herokuapp.com/v2/quotes' + `?id=${id}&from=${from}&token=${t}`),
    quoteDecoders
)

export const fetchQuoteWithDelay = fetchWithAuth(
    () => t => ajax('https://ron-swanson-quotes.herokuapp.com/v2/quotes' + `?token=${t}`).pipe(delay(5000)),
    quoteDecoders
)
