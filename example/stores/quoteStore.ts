import { flow } from 'fp-ts/function'
import { Observable, of } from 'rxjs'
import { map } from 'rxjs/operators'
import * as RR from '../../src/http/ObservableResource'
import * as RES from '../../src/http/Resource'
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
    quote: RES.init,
}

// constructor

export const quoteStore = MS.ctor(() => ({ name: 'quote', initState: quoteState }))

// mutation

export const fetchQuoteMutation = flow(fetchQuote, fetch =>
    MS.ctorMutation(
        'fetchQuoteMutation',
        RR.toMutationEffect(fetch, (o, s: QuoteState): Observable<QuoteState> => o.pipe(map(c => ({ ...s, quote: c }))))
    )
)

export const fetchQuoteMutationWithParams = flow(fetchQuoteWithParams, fetch =>
    MS.ctorMutation(
        'fetchQuoteMutationWithParams',
        RR.toMutationEffect(fetch, (o, s: QuoteState): Observable<QuoteState> => o.pipe(map(c => ({ ...s, quote: c }))))
    )
)

export const fetchQuoteMutationWithDelay = flow(fetchQuoteWithDelay, fetch =>
    MS.ctorMutation(
        'fetchQuoteMutationWithDelay',
        RR.toMutationEffect(fetch, (o, s: QuoteState): Observable<QuoteState> => o.pipe(map(c => ({ ...s, quote: c }))))
    )
)

export const resetQuoteMutation = () =>
    MS.ctorMutation('resetQuoteMutation', () => (s: QuoteState): Observable<QuoteState> =>
        of({ ...s, quote: RES.init })
    )
