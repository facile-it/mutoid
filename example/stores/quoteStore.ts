import { flow } from 'fp-ts/function'
import { Observable, of } from 'rxjs'
import { map } from 'rxjs/operators'
import * as MH from '../../src/http'
import * as MS from '../../src/state'
import { fetchQuote, fetchQuoteWithDelay, fetchQuoteWithParams, quoteResource } from '../resources/quoteResource'

declare module '../../src/state/stores' {
    interface Stores {
        quote:
            | 'fetchQuoteMutation'
            | 'fetchQuoteMutationWithParams'
            | 'fetchQuoteMutationWithDelay'
            | 'resetQuoteMutation'
    }
}

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

export const fetchQuoteMutation = flow(fetchQuote, fetch =>
    MS.ctorMutation(
        'fetchQuoteMutation',
        MH.resourceFetcherToMutationEffect(
            fetch,
            (o, s: QuoteState): Observable<QuoteState> => o.pipe(map(c => ({ ...s, quote: c })))
        )
    )
)

export const fetchQuoteMutationWithParams = flow(fetchQuoteWithParams, fetch =>
    MS.ctorMutation(
        'fetchQuoteMutationWithParams',
        MH.resourceFetcherToMutationEffect(
            fetch,
            (o, s: QuoteState): Observable<QuoteState> => o.pipe(map(c => ({ ...s, quote: c })))
        )
    )
)

export const fetchQuoteMutationWithDelay = flow(fetchQuoteWithDelay, fetch =>
    MS.ctorMutation(
        'fetchQuoteMutationWithDelay',
        MH.resourceFetcherToMutationEffect(
            fetch,
            (o, s: QuoteState): Observable<QuoteState> => o.pipe(map(c => ({ ...s, quote: c })))
        )
    )
)

export const resetQuoteMutation = () =>
    MS.ctorMutation('resetQuoteMutation', () => (s: QuoteState): Observable<QuoteState> =>
        of({ ...s, quote: MH.resourceInit })
    )
