import { pipe } from 'fp-ts/function'
import { serializeUrl, toQueryString } from '../../src/http/dataSerializer'
import type { AccessToken } from '../stores/sessionStore'
import type { EndpointRequest } from './fetchBuilder'

export const endpointRequestBuilder = <E extends Record<string, string | number>>(e?: E) => (
    accessToken: AccessToken
): EndpointRequest => ({
    method: 'GET',
    url: `https://ron-swanson-quotes.herokuapp.com/v2/quotes${pipe(
        { token: accessToken, ...e },
        serializeUrl(new URLSearchParams()),
        toQueryString
    )}`,
})
