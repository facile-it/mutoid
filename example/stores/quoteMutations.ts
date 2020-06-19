import * as MH from '../../src/http'
import { Observable, of } from 'rxjs'
import { fetchQuote, fetchQuoteWithDelay, fetchQuoteWithParams } from '../resources/quoteResource'
import { map } from 'rxjs/operators'
import { quoteState } from './quoteStore'

export const fetchQuoteMutation = MH.resourceFetcherToMutation(fetchQuote, (o, s: quoteState) =>
    o.pipe(map(c => ({ ...s, quote: c })))
)

export const fetchQuoteMutationWithParams = MH.resourceFetcherToMutation(fetchQuoteWithParams, (o, s: quoteState) =>
    o.pipe(map(c => ({ ...s, quote: c })))
)

export const fetchQuoteMutationWithDelay = MH.resourceFetcherToMutation(fetchQuoteWithDelay, (o, s: quoteState) =>
    o.pipe(map(c => ({ ...s, quote: c })))
)

export const resetQuoteMutation = () => (s: quoteState): Observable<quoteState> => {
    return of({
        ...s,
        quote: MH.resourceInit,
    })
}
