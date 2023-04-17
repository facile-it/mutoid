import { sequenceS } from 'fp-ts/Apply'
import { flow, pipe } from 'fp-ts/function'
import * as t from 'io-ts'
import { nonEmptyArray } from 'io-ts-types/nonEmptyArray'
import type { ajax } from 'rxjs/ajax'
import { delay } from 'rxjs/operators'
import * as OR from '../../src/http/ObservableResource'
import * as ROR from '../../src/http/ReaderObservableResource'
import type * as RES from '../../src/http/Resource'
import type * as RESFF from '../../src/http/resourceFetchFactory'
import { appEndpointRequest, appEndpointRequestCacheable, appFetchCacheable, appFetchFactory } from './appFetchFactory'

export const quoteDecoders = () => ({
    200: nonEmptyArray(t.string).decode,
    400: t.string.decode,
})

export type QuoteResource = RES.Resource<
    RESFF.ResourceBad,
    Extract<RES.DecodersToResourceData<ReturnType<typeof quoteDecoders>>, { status: 200 }>
>

// example: fetch with token but without params

export const fetchQuote = () => appFetchFactory(appEndpointRequest(), quoteDecoders, [200])

// example: fetch with token and params

export const fetchQuoteWithTokenAndParams = (id: number) =>
    appFetchFactory(appEndpointRequest({ id }), quoteDecoders, [200])

// example: simple fetch with params

export const fetchSimple = (id: number, from: string) => (deps: { ajax: typeof ajax }) =>
    OR.fromAjax(
        deps.ajax({
            url: `https://ron-swanson-quotes.herokuapp.com/v2/quotes?id=${id}&from=${from}`,
            crossDomain: true,
        }),
        quoteDecoders()
    )

// example: fetch with delay

export const fetchQuoteWithDelay = () =>
    flow(appFetchFactory(appEndpointRequest(), quoteDecoders, [200]), o => o.pipe(delay(5_000)))

// example: fetch in series the quotes

export const fetchQuoteSeq = () =>
    pipe(
        appFetchFactory(appEndpointRequest(), quoteDecoders, [200]),
        ROR.bindTo('firstFetch'),
        ROR.bind('secondFetch', ff =>
            appFetchFactory(appEndpointRequest({ ff: ff.firstFetch.status }), quoteDecoders, [200])
        ),
        ROR.map(c => [...c.firstFetch.payload, ...c.secondFetch.payload])
    )

// example: fetch in parallel the quotes

export const fetchQuoteSeqPar = () =>
    pipe(
        sequenceS(ROR.Applicative)({
            firstFetch: appFetchFactory(appEndpointRequest(), quoteDecoders, [200]),
            secondFetch: appFetchFactory(appEndpointRequest(), quoteDecoders, [200]),
        }),
        ROR.map(c => [...c.firstFetch.payload, ...c.secondFetch.payload])
    )

// example: fetch with cache

export const fetchQuoteCached = () => appFetchCacheable(appEndpointRequestCacheable(), quoteDecoders, [200])
