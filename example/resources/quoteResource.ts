import * as t from 'io-ts'
import { delay } from 'rxjs/operators'
import { Resource } from '../../src/http'
import { authAppError, fetchWithAuth, ResourceDeps } from './fetchWithAuth'

export const quoteDecoders = {
    200: t.array(t.string).decode,
    400: t.string.decode,
}

export type quoteResource = Resource<typeof quoteDecoders, authAppError>

export const fetchQuote = (deps: ResourceDeps) =>
    fetchWithAuth(deps.store)(
        () => token => deps.ajax(`https://ron-swanson-quotes.herokuapp.com/v2/quotes?token=${token}`),
        quoteDecoders
    )

export const fetchQuoteWithParams = (deps: ResourceDeps) =>
    fetchWithAuth(deps.store)(
        (id: number, from: string) => token =>
            deps.ajax(`https://ron-swanson-quotes.herokuapp.com/v2/quotes?id=${id}&from=${from}&token=${token}`),
        quoteDecoders
    )

export const fetchQuoteWithDelay = (deps: ResourceDeps) =>
    fetchWithAuth(deps.store)(
        () => token => deps.ajax(`https://ron-swanson-quotes.herokuapp.com/v2/quotes?token=${token}`).pipe(delay(5000)),
        quoteDecoders
    )
