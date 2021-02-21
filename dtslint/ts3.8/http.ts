/* eslint-disable @typescript-eslint/no-unused-vars */
import { pipe } from 'fp-ts/function'
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
// $ExpectType ObservableResourceTypeOf<{ 200: Decode<unknown, { data: string; }>; 400: Decode<unknown, { data: number; }>; }, never>
const resourceUnknownFail = OR.fromAjax(ajaxFetchUnknownFail, decoders)

declare const ajaxFetchWithFail: Observable<AjaxResponse | MRE.ResourceAjaxFail<string>>

// eslint-disable-next-line max-len
// $ExpectType ObservableResourceTypeOf<{ 200: Decode<unknown, { data: string; }>; 400: Decode<unknown, { data: number; }>; }, string>
const resourceWithFail = OR.fromAjax(ajaxFetchWithFail, decoders)

// $ExpectType () => (s: { counter: number; }) => Observable<{ counter: number; }>
const noParam = pipe(
    () => resourceWithFail,
    OR.fetchToMutationEffect((s: { counter: number }) => _i => s)
)

// $ExpectType (id: string) => (s: { counter: number; }) => Observable<{ counter: number; }>
const withOneParam = pipe(
    (id: string) => resourceUnknownFail,
    OR.fetchToMutationEffect((s: { counter: number }) => _i => s)
)

// $ExpectType (id: string, name: string) => (s: { counter: number; }) => Observable<{ counter: number; }>
const withTwoParam = pipe(
    (id: string, name: string) => resourceUnknownFail,
    OR.fetchToMutationEffect((s: { counter: number }) => _i => s)
)
