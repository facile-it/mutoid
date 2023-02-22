export const StatusInformational = {
    100: 'Continue',
    101: 'SwitchingProtocols',
    102: 'Processing',
    103: 'EarlyHints',
} as const

export type StatusInformational = keyof typeof StatusInformational

export const StatusSuccess = {
    200: 'OK',
    201: 'Created',
    202: 'Accepted',
    203: 'NonAuthoritativeInformation',
    204: 'NoContent',
    205: 'ResetContent',
    206: 'PartialContent',
    207: 'MultiStatus',
    208: 'AlreadyReported',
    226: 'IMUsed',
} as const

export type StatusSuccess = keyof typeof StatusSuccess

export const StatusRedirection = {
    300: 'MultipleChoices',
    301: 'MovedPermanently',
    302: 'Found',
    303: 'SeeOther',
    304: 'NotModified',
    305: 'UseProxy',
    306: 'SwitchProxy',
    307: 'TemporaryRedirect',
    308: 'PermanentRedirect',
} as const

export type StatusRedirection = keyof typeof StatusRedirection

export const StatusSuccessWidden = { ...StatusInformational, ...StatusSuccess, ...StatusRedirection }

export const StatusClientError = {
    400: 'BadRequest',
    401: 'Unauthorized',
    402: 'PaymentRequired',
    403: 'Forbidden',
    404: 'NotFound',
    405: 'MethodNotAllowed',
    406: 'NotAcceptable',
    407: 'ProxyAuthenticationRequired',
    408: 'RequestTimeout',
    409: 'Conflict',
    410: 'Gone',
    411: 'LengthRequired',
    412: 'PreconditionFailed',
    413: 'PayloadTooLarge',
    414: 'URITooLong',
    415: 'UnsupportedMediaType',
    416: 'RangeNotSatisfiable',
    417: 'ExpectationFailed',
    418: 'Teapot',
    421: 'MisdirectedRequest',
    422: 'UnprocessableEntity',
    423: 'Locked',
    424: 'FailedDependency',
    425: 'TooEarly',
    426: 'UpgradeRequired',
    428: 'PreconditionRequired',
    429: 'TooManyRequests',
    431: 'RequestHeaderFieldsTooLarge',
    451: 'UnavailableForLegalReasons',
} as const

export type StatusClientError = keyof typeof StatusClientError

export const StatusServerError = {
    500: 'InternalServerError',
    501: 'NotImplemented',
    502: 'BadGateway',
    503: 'ServiceUnavailable',
    504: 'GatewayTimeout',
    505: 'HTTPVersionNotSupported',
    506: 'VariantAlsoNegotiates',
    507: 'InsufficientStorage',
    508: 'LoopDetected',
    510: 'NotExtended',
    511: 'NetworkAuthenticationRequired',
} as const

export type StatusServerError = keyof typeof StatusServerError

export const StatusCodeMap = {
    ...StatusInformational,
    ...StatusSuccess,
    ...StatusRedirection,
    ...StatusClientError,
    ...StatusServerError,
} as const

export type StatusCode = StatusInformational | StatusSuccess | StatusRedirection | StatusClientError | StatusServerError

export const statusPredicate =
    <S extends Record<number, string>>(s: S) =>
    (e: any): e is keyof S =>
        typeof (s as any)[e] === 'string'
