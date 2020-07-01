import { resourceInit } from '../../src/http'
import * as MS from '../../src/state'
import { quoteResource } from '../resources/quoteResource'

export interface QuoteState {
    quote: quoteResource
}

const quoteState: QuoteState = {
    quote: resourceInit,
}

export const quoteStore = MS.of(() => ({ name: 'quote', initState: quoteState }))
