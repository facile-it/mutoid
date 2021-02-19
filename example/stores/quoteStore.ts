import { pipe } from 'fp-ts/function'
import { Observable, of } from 'rxjs'
import * as ROR from '../../src/http/ReaderObservableResource'
import * as RES from '../../src/http/Resource'
import * as MS from '../../src/state'
import { fetchQuote, fetchQuoteWithDelay, fetchQuoteWithParams, quoteResource } from '../resources/quoteResource'

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

// type

export interface QuoteState {
    quote: quoteResource
}

const quoteState: QuoteState = {
    quote: RES.init,
}

// constructor

export const quoteStore = MS.ctor(() => ({ name: 'quote', initState: quoteState }))

// mutationR

/**
 * mutationR is a function with this type: (deps?: R) => Mutation<NM, P, S, SS>
 */

export const fetchQuoteMutation = pipe(
    fetchQuote,
    ROR.fetchToMutationEffectR((s: QuoteState) => (quote): QuoteState => ({ ...s, quote })),
    MS.ctorMutationCR('fetchQuoteMutation')
)

export const fetchQuoteMutationWithParams = pipe(
    fetchQuoteWithParams,
    ROR.fetchToMutationEffectR((s: QuoteState) => (quote): QuoteState => ({ ...s, quote })),
    MS.ctorMutationCR('fetchQuoteMutationWithParams')
)

export const fetchQuoteMutationWithDelay = pipe(
    fetchQuoteWithDelay,
    ROR.fetchToMutationEffectR((s: QuoteState) => (quote): QuoteState => ({ ...s, quote })),
    MS.ctorMutationCR('fetchQuoteMutationWithDelay')
)

export const resetQuoteMutation = () =>
    MS.ctorMutation('resetQuoteMutation', () => (s: QuoteState): Observable<QuoteState> =>
        of({ ...s, quote: RES.init })
    )
