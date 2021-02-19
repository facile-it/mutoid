/* eslint-disable @typescript-eslint/no-unused-vars */
import * as t from 'io-ts'
import { Observable } from 'rxjs'
import { AjaxResponse } from 'rxjs/ajax'
import { map } from 'rxjs/operators'
import * as OR from '../../src/http/ObservableResource'
import * as MRE from '../../src/http/Resource'

declare const ajaxFetchUnknownFail: Observable<AjaxResponse>
declare const decoderDataString: t.Decode<unknown, { data: string }>
declare const decoderDataNumber: t.Decode<unknown, { data: number }>
declare const decoders: {
    200: typeof decoderDataString
    400: typeof decoderDataNumber
}

// eslint-disable-next-line max-len
// $ExpectType Observable<ResourceTypeOfStarted<{ 200: Decode<unknown, { data: string; }>; 400: Decode<unknown, { data: number; }>; }, never>>
const resourceUnknownFail = OR.fromAjax(ajaxFetchUnknownFail, decoders)

declare const ajaxFetchWithFail: Observable<AjaxResponse | MRE.ResourceAjaxFail<string>>

// eslint-disable-next-line max-len
// $ExpectType Observable<ResourceTypeOfStarted<{ 200: Decode<unknown, { data: string; }>; 400: Decode<unknown, { data: number; }>; }, string>>
const resourceWithFail = OR.fromAjax(ajaxFetchWithFail, decoders)

// $ExpectType () => (s: { counter: number; }) => Observable<{ counter: number; }>
const noParam = OR.toMutationEffect(
    () => resourceWithFail,
    (i, s: { counter: number }) => i.pipe(map(_ => s))
)

// $ExpectType (id: string) => (s: { counter: number; }) => Observable<{ counter: number; }>
const withOneParam = OR.toMutationEffect(
    (id: string) => resourceUnknownFail,
    (i, s: { counter: number }) => i.pipe(map(_ => s))
)

// $ExpectType (id: string, name: string) => (s: { counter: number; }) => Observable<{ counter: number; }>
const withTwoParam = OR.toMutationEffect(
    (id: string, name: string) => resourceUnknownFail,
    (i, s: { counter: number }) => i.pipe(map(_ => s))
)
