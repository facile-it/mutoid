import * as MS from '../../src/state'
import { quoteResource } from '../resources/quoteResource'
import { resourceInit } from '../../src/http'

export interface quoteState {
    quote: quoteResource
}

const quoteState: quoteState = {
    quote: resourceInit,
}

export const quoteStore = MS.of(quoteState)
