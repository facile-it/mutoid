import { Observable, of } from 'rxjs'
import { map } from 'rxjs/operators'
import * as MH from '../../src/http'
import * as MS from '../../src/state'
import { ResourceDeps } from '../resources/fetchWithAuth'
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

export const fetchQuoteMutation = (deps: ResourceDeps) =>
    MS.ctorMutation(
        'fetchQuoteMutation' as const,
        MH.resourceFetcherToMutationEffect(
            fetchQuote(deps),
            (o, s: QuoteState): Observable<QuoteState> => o.pipe(map(c => ({ ...s, quote: c })))
        )
    )

export const fetchQuoteMutationWithParams = (deps: ResourceDeps) =>
    MS.ctorMutation(
        'fetchQuoteMutationWithParams' as const,
        MH.resourceFetcherToMutationEffect(
            fetchQuoteWithParams(deps),
            (o, s: QuoteState): Observable<QuoteState> => o.pipe(map(c => ({ ...s, quote: c })))
        )
    )

export const fetchQuoteMutationWithDelay = (deps: ResourceDeps) =>
    MS.ctorMutation(
        'fetchQuoteMutationWithDelay' as const,
        MH.resourceFetcherToMutationEffect(
            fetchQuoteWithDelay(deps),
            (o, s: QuoteState): Observable<QuoteState> => o.pipe(map(c => ({ ...s, quote: c })))
        )
    )

export const resetQuoteMutation = () =>
    MS.ctorMutation('resetQuoteMutation' as const, () => (s: QuoteState): Observable<QuoteState> =>
        of({ ...s, quote: MH.resourceInit })
    )
