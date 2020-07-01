import { Observable, of } from 'rxjs'
import { map } from 'rxjs/operators'
import * as MH from '../../src/http'
import { fetchQuote, fetchQuoteWithDelay, fetchQuoteWithParams } from '../resources/quoteResource'
import { QuoteState } from './quoteStore'

export const fetchQuoteMutation = MH.resourceFetcherToMutation(fetchQuote, (o, s: QuoteState) =>
    o.pipe(map(c => ({ ...s, quote: c })))
)

export const fetchQuoteMutationWithParams = MH.resourceFetcherToMutation(fetchQuoteWithParams, (o, s: QuoteState) =>
    o.pipe(map(c => ({ ...s, quote: c })))
)

export const fetchQuoteMutationWithDelay = MH.resourceFetcherToMutation(fetchQuoteWithDelay, (o, s: QuoteState) =>
    o.pipe(map(c => ({ ...s, quote: c })))
)

export const resetQuoteMutation = () => (s: QuoteState): Observable<QuoteState> => {
    return of({
        ...s,
        quote: MH.resourceInit,
    })
}
