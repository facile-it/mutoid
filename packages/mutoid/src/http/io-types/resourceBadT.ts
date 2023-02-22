import * as t from 'io-ts'
import { statusCodeWithZeroT } from './statusCodeT'

export const resourceBadRejectedT = t.interface(
    {
        type: t.literal('rejected'),
        error: t.keyof({ notFound: null, clientError: null }),
        errorMessage: t.string,
        statusCode: statusCodeWithZeroT,
        detail: t.unknown,
    },
    'ResourceBadRejected'
)

export const resourceBadFailT = t.interface(
    {
        type: t.literal('fail'),
        error: t.keyof({
            unexpectedResponse: null,
            unknownError: null,
            networkError: null,
            decodeError: null,
            fail: null,
            appError: null,
        }),
        errorMessage: t.string,
        statusCode: statusCodeWithZeroT,
        detail: t.unknown,
    },
    'ResourceBadRejected'
)

export const resourceBadT = t.union([resourceBadRejectedT, resourceBadFailT], 'ResourceBad')
