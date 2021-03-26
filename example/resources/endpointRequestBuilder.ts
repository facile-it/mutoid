import { serializeNullableToQueryString } from '../../src/http/serializeToQueryString'
import type { AccessToken } from '../stores/sessionStore'
import type { EndpointRequest } from './fetchBuilder'

export const endpointRequestBuilder = <E extends Record<string, string | number>>(e?: E) => (
    accessToken: AccessToken
): EndpointRequest => ({
    method: 'GET',
    url: `https://ron-swanson-quotes.herokuapp.com/v2/quotes${serializeNullableToQueryString({
        token: accessToken,
        ...e,
    })}`,
})
