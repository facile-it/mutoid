import * as R from 'fp-ts/lib/Reader'
import { pipe } from 'fp-ts/lib/function'
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

export const fetchQuoteMutation = pipe(
    fetchQuote,
    R.map(fetch =>
        MS.ctorMutation(
            'fetchQuoteMutation' as const,
            MH.resourceFetcherToMutationEffect(
                fetch,
                (o, s: QuoteState): Observable<QuoteState> => o.pipe(map(c => ({ ...s, quote: c })))
            )
        )
    )
)

export const fetchQuoteMutationWithParams = pipe(
    fetchQuoteWithParams,
    R.map(fetch =>
        MS.ctorMutation(
            'fetchQuoteMutationWithParams' as const,
            MH.resourceFetcherToMutationEffect(
                fetch,
                (o, s: QuoteState): Observable<QuoteState> => o.pipe(map(c => ({ ...s, quote: c })))
            )
        )
    )
)

export const fetchQuoteMutationWithDelay = pipe(
    fetchQuoteWithDelay,
    R.map(fetch =>
        MS.ctorMutation(
            'fetchQuoteMutationWithDelay' as const,
            MH.resourceFetcherToMutationEffect(
                fetch,
                (o, s: QuoteState): Observable<QuoteState> => o.pipe(map(c => ({ ...s, quote: c })))
            )
        )
    )
)

export const resetQuoteMutation = () =>
    MS.ctorMutation('resetQuoteMutation' as const, () => (s: QuoteState): Observable<QuoteState> =>
        of({ ...s, quote: MH.resourceInit })
    )
