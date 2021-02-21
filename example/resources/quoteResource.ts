import { sequenceS } from 'fp-ts/Apply'
import { pipe } from 'fp-ts/function'
import * as t from 'io-ts'
import { nonEmptyArray } from 'io-ts-types/nonEmptyArray'
import { ajax } from 'rxjs/ajax'
import { delay } from 'rxjs/operators'
import * as OR from '../../src/http/ObservableResource'
import * as ROR from '../../src/http/ReaderObservableResource'
import * as RES from '../../src/http/Resource'
import type { StatusCode } from '../../src/http/statusCode'
import { authAppError, fetchWithAuth } from './fetchWithAuth'

export const quoteDecoders = {
    200: nonEmptyArray(t.string).decode,
    400: t.string.decode,
}

export type quoteResource = RES.ResourceTypeOf<typeof quoteDecoders, authAppError>

export interface Deps {
    ajax: typeof ajax
}

//  example: fetch with token but without params

export const fetchQuote = () =>
    pipe(
        fetchWithAuth,
        ROR.chainW(token => (deps: Deps) =>
            OR.fromAjax(deps.ajax(`https://ron-swanson-quotes.herokuapp.com/v2/quotes?token=${token}`), quoteDecoders)
        )
    )

// example: fetch with token and params

export const fetchQuoteWithTokenAndParams = (id: number) =>
    pipe(
        fetchWithAuth,
        ROR.chainW(token => (deps: Deps) =>
            OR.fromAjax(
                deps.ajax(`https://ron-swanson-quotes.herokuapp.com/v2/quotes?token=${token}&id=${id}`),
                quoteDecoders
            )
        )
    )

// example: simple fetch without token but with params

export const fetchQuoteWithParams = (id: number, from: string) =>
    pipe(
        ROR.askTypeOf<Deps, typeof quoteDecoders>(),
        ROR.chainW(deps =>
            ROR.fromAjax(
                deps.ajax(`https://ron-swanson-quotes.herokuapp.com/v2/quotes?id=${id}&from=${from}`),
                quoteDecoders
            )
        )
    )

// example: same fetchQuoteWithParams different definition

export const fetchQuoteWithParams1 = (id: number, from: string) => (deps: Deps) => {
    return OR.fromAjax(
        deps.ajax(`https://ron-swanson-quotes.herokuapp.com/v2/quotes?id=${id}&from=${from}`),
        quoteDecoders
    )
}

// example: fetch quote with delay

export const fetchQuoteWithDelay = () =>
    pipe(
        fetchWithAuth,
        ROR.chainW(token => (deps: Deps) =>
            OR.fromAjax(
                deps.ajax(`https://ron-swanson-quotes.herokuapp.com/v2/quotes?token=${token}`).pipe(delay(5000)),
                quoteDecoders
            )
        )
    )

//  example: fetch with no deps

export const fetchQuoteWithNoDeps = () =>
    OR.fromAjax(ajax(`https://ron-swanson-quotes.herokuapp.com/v2/quotes`), quoteDecoders)

//  example: fetch quote concatenated

type PickStatus<D, K extends keyof D, S extends StatusCode> = Omit<D, K> &
    {
        [k in K]: Extract<D[K], { status: S }>
    }

export const fetchQuoteConcat = () =>
    pipe(
        fetchWithAuth,
        ROR.bindTo('token'),
        ROR.bindW('firstFetch', d => (deps: Deps) =>
            OR.fromAjax(deps.ajax(`https://ron-swanson-quotes.herokuapp.com/v2/quotes?token=${d.token}`), quoteDecoders)
        ),
        ROR.filterOrElseW(
            (r): r is PickStatus<typeof r, 'firstFetch', 200> => r.firstFetch.status === 200,
            c => RES.appError(`FirstFetch rejected ${c.firstFetch.status}`)
        ),
        ROR.bindW('secondFetch', d => (deps: Deps) =>
            OR.fromAjax(
                deps.ajax(
                    `https://ron-swanson-quotes.herokuapp.com/v2/quotes?token=${d.token}${d.firstFetch.payload[0]}`
                ),
                quoteDecoders
            )
        ),
        ROR.filterOrElseW(
            (r): r is PickStatus<typeof r, 'secondFetch', 200> => r.secondFetch.status === 200,
            c => RES.appError(`SecondFetch rejected ${c.firstFetch.status}`)
        ),
        ROR.map(c => [...c.firstFetch.payload, ...c.secondFetch.payload])
    )

//  example: fetch quote sequentially parallel

export const fetchQuoteSeqPar = () =>
    pipe(
        fetchWithAuth,
        ROR.chainW(token =>
            sequenceS(ROR.Applicative)({
                firstFetch: (deps: Deps) =>
                    OR.fromAjax(
                        deps.ajax(`https://ron-swanson-quotes.herokuapp.com/v2/quotes?token=${token}`),
                        quoteDecoders
                    ),
                secondFetch: (deps: Deps) =>
                    OR.fromAjax(
                        deps.ajax(`https://ron-swanson-quotes.herokuapp.com/v2/quotes?token=${token} `),
                        quoteDecoders
                    ),
            })
        ),
        ROR.filterOrElseW(
            (r): r is PickStatus<typeof r, 'secondFetch' | 'firstFetch', 200> =>
                r.secondFetch.status === 200 && r.secondFetch.status === 200,
            c => RES.appError(`Fetches rejected ${c.firstFetch.status} ${c.secondFetch.status}`)
        ),
        ROR.map(c => [...c.firstFetch.payload, ...c.secondFetch.payload])
    )
