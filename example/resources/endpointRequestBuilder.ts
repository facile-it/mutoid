import { serializeNullableToQueryParams } from '../../src/http/serializeToQueryParams'
import type { AccessToken } from '../stores/sessionStore'
import type { EndpointRequest } from './fetchBuilder'

export const endpointRequestBuilder = <E extends Record<string, string | number>>(e?: E) => (
    accessToken: AccessToken
): EndpointRequest => ({
    method: 'GET',
    url: `https://ron-swanson-quotes.herokuapp.com/v2/quotes${serializeNullableToQueryParams({
        token: accessToken,
        ...e,
    })}`,
})
