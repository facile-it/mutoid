import { pipe } from 'fp-ts/function'
import * as t from 'io-ts'
import { nonEmptyArray } from 'io-ts-types/nonEmptyArray'
import { ajax } from 'rxjs/ajax'
import { delay } from 'rxjs/operators'
import * as OR from '../../src/http/ObservableResource'
import * as ROR from '../../src/http/ReaderObservableResource'
import type * as RES from '../../src/http/Resource'
import { authAppError, fetchWithAuth } from './fetchWithAuth'

export const quoteDecoders = {
    200: nonEmptyArray(t.string).decode,
    400: t.string.decode,
}

export type quoteResource = RES.ResourceTypeOf<typeof quoteDecoders, authAppError>

//  example: fetch with token but without params

export const fetchQuote = () =>
    pipe(
        fetchWithAuth,
        ROR.chainW(token => (deps: { ajax: typeof ajax }) =>
            OR.fromAjax(deps.ajax(`https://ron-swanson-quotes.herokuapp.com/v2/quotes?token=${token}`), quoteDecoders)
        )
    )

// example: fetch with token and params

export const fetchQuoteWithTokenAndParams = (id: number) =>
    pipe(
        fetchWithAuth,
        ROR.chainW(token => (deps: { ajax: typeof ajax }) =>
            OR.fromAjax(
                deps.ajax(`https://ron-swanson-quotes.herokuapp.com/v2/quotes?token=${token}&id=${id}`),
                quoteDecoders
            )
        )
    )

// example: simple fetch without token but with params

export const fetchQuoteWithParams = (id: number, from: string) => {
    return pipe(
        ROR.ask<{ ajax: typeof ajax }, RES.DecodersToResourceError<typeof quoteDecoders, never>>(),
        ROR.chainW(deps =>
            ROR.fromAjax(
                deps.ajax(`https://ron-swanson-quotes.herokuapp.com/v2/quotes?id=${id}&from=${from}`),
                quoteDecoders
            )
        )
    )
}

// example: same fetchQuoteWithParams different definition

export const fetchQuoteWithParams1 = (id: number, from: string) => (deps: { ajax: typeof ajax; param: string }) => {
    return OR.fromAjax(
        deps.ajax(`https://ron-swanson-quotes.herokuapp.com/v2/quotes?id=${id}&from=${from}`),
        quoteDecoders
    )
}

// example: fetch quote with delay

export const fetchQuoteWithDelay = () =>
    pipe(
        fetchWithAuth,
        ROR.chainW(token => (deps: { ajax: typeof ajax }) =>
            OR.fromAjax(
                deps.ajax(`https://ron-swanson-quotes.herokuapp.com/v2/quotes?token=${token}`).pipe(delay(5000)),
                quoteDecoders
            )
        )
    )

//  example: fetch with no deps

export const fetchQuoteWithNoDeps = () =>
    OR.fromAjax(ajax(`https://ron-swanson-quotes.herokuapp.com/v2/quotes`), quoteDecoders)
