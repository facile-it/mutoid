import { Observable, of } from 'rxjs'
import { map } from 'rxjs/operators'
import * as MH from '../../src/http'
import * as MS from '../../src/state'
import { fetchQuote, fetchQuoteWithDelay, fetchQuoteWithParams, quoteResource } from '../resources/quoteResource'

// type

export interface QuoteState {
    quote: quoteResource
}

const quoteState: QuoteState = {
    quote: MH.resourceInit,
}

// constructor

export const quoteStore = MS.ctor(() => ({ name: 'quote', initState: quoteState }))

// mutation

export const fetchQuoteMutation = () =>
    MS.ctorMutation(
        'fetchQuoteMutation' as const,
        MH.resourceFetcherToMutationEffect(
            fetchQuote,
            (o, s: QuoteState): Observable<QuoteState> => o.pipe(map(c => ({ ...s, quote: c })))
        )
    )

export const fetchQuoteMutationWithParams = () =>
    MS.ctorMutation(
        'fetchQuoteMutationWithParams' as const,
        MH.resourceFetcherToMutationEffect(
            fetchQuoteWithParams,
            (o, s: QuoteState): Observable<QuoteState> => o.pipe(map(c => ({ ...s, quote: c })))
        )
    )

export const fetchQuoteMutationWithDelay = () =>
    MS.ctorMutation(
        'fetchQuoteMutationWithDelay' as const,
        MH.resourceFetcherToMutationEffect(
            fetchQuoteWithDelay,
            (o, s: QuoteState): Observable<QuoteState> => o.pipe(map(c => ({ ...s, quote: c })))
        )
    )

export const resetQuoteMutation = () =>
    MS.ctorMutation('resetQuoteMutation' as const, () => (s: QuoteState): Observable<QuoteState> =>
        of({ ...s, quote: MH.resourceInit })
    )
