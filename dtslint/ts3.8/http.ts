import * as MH from '../../src/http'
import * as t from 'io-ts'
import { AjaxResponse } from 'rxjs/ajax'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'

declare const ajaxFetchUnknownFail: Observable<AjaxResponse>
declare const decoderDataString: t.Decode<unknown, { data: string }>
declare const decoderDataNumber: t.Decode<unknown, { data: number }>
declare const mutation: {
    200: typeof decoderDataString
    400: typeof decoderDataNumber
}

// eslint-disable-next-line max-len
// $ExpectType Observable<ResourceSubmitted | ResourceFail<unknown> | ResourceDone<200, { data: string; }> | ResourceDone<400, { data: number; }>>
const resourceUnknownFail = MH.ajaxToResource(ajaxFetchUnknownFail, mutation)

declare const ajaxFetchWithFail: Observable<AjaxResponse | MH.ResourceFail<string>>

// eslint-disable-next-line max-len
// $ExpectType Observable<ResourceSubmitted | ResourceDone<200, { data: string; }> | ResourceDone<400, { data: number; }> | ResourceFail<string>>
const resourceWithFail = MH.ajaxToResource(ajaxFetchWithFail, mutation)

// $ExpectType () => (s: { counter: number; }) => Observable<{ counter: number; }>
const noParam = MH.resourceFetcherToMutation(
    () => resourceWithFail,
    (i, s: { counter: number }) => i.pipe(map(_ => s))
)

// $ExpectType (id: string) => (s: { counter: number; }) => Observable<{ counter: number; }>
const withOneParam = MH.resourceFetcherToMutation(
    (id: string) => resourceUnknownFail,
    (i, s: { counter: number }) => i.pipe(map(_ => s))
)

// $ExpectType (id: string, name: string) => (s: { counter: number; }) => Observable<{ counter: number; }>
const withTwoParam = MH.resourceFetcherToMutation(
    (id: string, name: string) => resourceUnknownFail,
    (i, s: { counter: number }) => i.pipe(map(_ => s))
)
