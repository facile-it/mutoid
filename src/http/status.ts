export const StatusInformational = {
    Continue: 100,
    SwitchingProtocols: 101,
    Processing: 102,
    EarlyHints: 103,
} as const

export type StatusInformational = typeof StatusInformational[keyof typeof StatusInformational]

export const StatusSuccess = {
    OK: 200,
    Created: 201,
    Accepted: 202,
    NonAuthoritativeInformation: 203,
    NoContent: 204,
    ResetContent: 205,
    PartialContent: 206,
    MultiStatus: 207,
    AlreadyReported: 208,
    IMUsed: 226,
} as const

export type StatusSuccess = typeof StatusSuccess[keyof typeof StatusSuccess]

export const StatusRedirection = {
    MultipleChoices: 300,
    MovedPermanently: 301,
    Found: 302,
    SeeOther: 303,
    NotModified: 304,
    UseProxy: 305,
    SwitchProxy: 306,
    TemporaryRedirect: 307,
    PermanentRedirect: 308,
} as const

export type StatusRedirection = typeof StatusRedirection[keyof typeof StatusRedirection]

export const StatusSuccessWidden = { ...StatusInformational, ...StatusRedirection, ...StatusSuccess }

export const StatusClientError = {
    BadRequest: 400,
    Unauthorized: 401,
    PaymentRequired: 402,
    Forbidden: 403,
    NotFound: 404,
    MethodNotAllowed: 405,
    NotAcceptable: 406,
    ProxyAuthenticationRequired: 407,
    RequestTimeout: 408,
    Conflict: 409,
    Gone: 410,
    LengthRequired: 411,
    PreconditionFailed: 412,
    PayloadTooLarge: 413,
    URITooLong: 414,
    UnsupportedMediaType: 415,
    RangeNotSatisfiable: 416,
    ExpectationFailed: 417,
    Teapot: 418,
    MisdirectedRequest: 421,
    UnprocessableEntity: 422,
    Locked: 423,
    FailedDependency: 424,
    TooEarly: 425,
    UpgradeRequired: 426,
    PreconditionRequired: 428,
    TooManyRequests: 429,
    RequestHeaderFieldsTooLarge: 431,
    UnavailableForLegalReasons: 451,
} as const

export type StatusClientError = typeof StatusClientError[keyof typeof StatusClientError]

export const StatusServerError = {
    InternalServerError: 500,
    NotImplemented: 501,
    BadGateway: 502,
    ServiceUnavailable: 503,
    GatewayTimeout: 504,
    HTTPVersionNotSupported: 505,
    VariantAlsoNegotiates: 506,
    InsufficientStorage: 507,
    LoopDetected: 508,
    NotExtended: 510,
    NetworkAuthenticationRequired: 511,
} as const

export type StatusServerError = typeof StatusServerError[keyof typeof StatusServerError]

export type StatusCode = StatusInformational | StatusSuccess | StatusRedirection | StatusClientError | StatusServerError

export const statusPredicate = <S extends { [k: string]: number }>(s: S) => (e: number): e is S[keyof S] =>
    Object.values(s).includes(e)
