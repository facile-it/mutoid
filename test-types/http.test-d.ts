import { pipe } from 'fp-ts/function'
import type * as t from 'io-ts'
import type { Observable } from 'rxjs'
import type { AjaxResponse } from 'rxjs/ajax'
import { expectType } from 'tsd'
import * as OR from '../src/http/ObservableResource'
import type * as MRE from '../src/http/Resource'

declare const ajaxFetchUnknownFail: Observable<AjaxResponse<unknown>>
declare const decoderDataString: t.Decode<unknown, { data: string }>
declare const decoderDataNumber: t.Decode<unknown, { data: number }>
declare const decoders: {
    200: typeof decoderDataString
    400: typeof decoderDataNumber
}

const resourceUnknownFail = OR.fromAjax(ajaxFetchUnknownFail, decoders)
expectType<
    OR.ObservableResourceTypeOf<
        { 200: t.Decode<unknown, { data: string }>; 400: t.Decode<unknown, { data: number }> },
        never
    >
>(resourceUnknownFail)

declare const ajaxFetchWithFail: Observable<AjaxResponse<unknown> | MRE.ResourceAjaxFail<string>>

const resourceWithFail = OR.fromAjax(ajaxFetchWithFail, decoders)
expectType<
    OR.ObservableResourceTypeOf<
        { 200: t.Decode<unknown, { data: string }>; 400: t.Decode<unknown, { data: number }> },
        string
    >
>(resourceWithFail)

const noParam = pipe(
    () => resourceWithFail,
    OR.fetchToMutationEffect((s: { counter: number }) => _i => s)
)
expectType<() => (s: { counter: number }) => Observable<{ counter: number }>>(noParam)

const withOneParam = pipe(
    (_id: string) => resourceUnknownFail,
    OR.fetchToMutationEffect((s: { counter: number }) => _i => s)
)
expectType<(_id: string) => (s: { counter: number }) => Observable<{ counter: number }>>(withOneParam)

const withTwoParam = pipe(
    (_id: string, _name: string) => resourceUnknownFail,
    OR.fetchToMutationEffect((s: { counter: number }) => _i => s)
)
expectType<(_id: string, _name: string) => (s: { counter: number }) => Observable<{ counter: number }>>(withTwoParam)
