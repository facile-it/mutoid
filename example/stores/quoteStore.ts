import { pipe } from 'fp-ts/function'
import { Observable, of } from 'rxjs'
import * as ROR from '../../src/http/ReaderObservableResource'
import * as RES from '../../src/http/Resource'
import * as MS from '../../src/state'
import {
    fetchQuote,
    fetchQuoteWithDelay,
    fetchQuoteWithTokenAndParams,
    QuoteResource,
} from '../resources/quoteResource'

declare module '../../src/state/stores' {
    interface Stores {
        quote:
            | 'fetchQuoteMutation'
            | 'fetchQuoteMutationWithParams'
            | 'fetchQuoteMutationWithParams2'
            | 'fetchQuoteMutationWithDelay'
            | 'resetQuoteMutation'
    }
}

// -------------------------------------------------------------------------------------
// Model
// -------------------------------------------------------------------------------------

export interface QuoteState {
    quote: QuoteResource
}

const quoteState: QuoteState = {
    quote: RES.init,
}

type QuoteStoreOpaque = ReturnType<typeof quoteStore>
export interface QuoteStore extends QuoteStoreOpaque {}

// -------------------------------------------------------------------------------------
// Constructor
// -------------------------------------------------------------------------------------

export const quoteStore = () => MS.ctor({ name: 'quote', initState: quoteState })

// -------------------------------------------------------------------------------------
// Mutation
// -------------------------------------------------------------------------------------

export const fetchQuoteMutation = pipe(
    fetchQuote,
    ROR.fetchToMutationEffectR(
        (s: QuoteState) =>
            (quote): QuoteState => ({ ...s, quote })
    ),
    MS.ctorMutationCR('fetchQuoteMutation')
)

export const fetchQuoteMutationWithParams = pipe(
    fetchQuoteWithTokenAndParams,
    ROR.fetchToMutationEffectR(
        (s: QuoteState) =>
            (quote): QuoteState => ({ ...s, quote })
    ),
    MS.ctorMutationCR('fetchQuoteMutationWithParams')
)

export const fetchQuoteMutationWithDelay = pipe(
    fetchQuoteWithDelay,
    ROR.fetchToMutationEffectR(
        (s: QuoteState) =>
            (quote): QuoteState => ({ ...s, quote })
    ),
    MS.ctorMutationCR('fetchQuoteMutationWithDelay')
)

export const resetQuoteMutation = () =>
    MS.ctorMutation(
        'resetQuoteMutation',
        () =>
            (s: QuoteState): Observable<QuoteState> =>
                of({ ...s, quote: RES.init })
    )
