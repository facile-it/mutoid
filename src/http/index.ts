import * as E from 'fp-ts/lib/Either'
import { pipe } from 'fp-ts/lib/pipeable'
import type * as t from 'io-ts'
import { Observable, concat, of } from 'rxjs'
import type { AjaxError, AjaxResponse } from 'rxjs/ajax'
import type { AjaxErrorNames } from 'rxjs/internal/observable/dom/AjaxObservable'
import { catchError, map, switchMap, take } from 'rxjs/operators'
import type { StatusCode } from './status'

// type

export interface ResourceInit {
    tag: 'init'
}

export interface ResourceSubmitted {
    tag: 'submitted'
}

export interface ResourceDone<S, P> {
    tag: 'done'
    status: S
    payload: P
}

export interface ResourceFail<AE = never> {
    tag: 'fail'
    error:
        | {
              type: 'unknownError'
              detail: unknown
          }
        | {
              type: 'decodeError'
              detail: decodeErrors
          }
        | {
              type: 'networkError'
              detail: AjaxError
          }
        | {
              type: 'unexpectedResponse'
              detail: AjaxResponse | AjaxError
          }
        | (AE extends never
              ? never
              : {
                    type: 'appError'
                    detail: AE
                })
}

export const resourceInit: ResourceInit = { tag: 'init' }
export const resourceSubmitted: ResourceSubmitted = { tag: 'submitted' }
export const resourceDone = <S, P>(status: S, payload: P): ResourceDone<S, P> => ({
    tag: 'done',
    status: status,
    payload: payload,
})
export const resourceFail = <AE = never>(error: ResourceFail<AE>['error']): ResourceFail<AE> => ({
    tag: 'fail',
    error: error,
})

export type Resource<DS extends ResourceDecoders, AE = never> =
    | ResourceInit
    | ResourceSubmitted
    | decodersDictToResourceDone<DS>
    | ResourceFail<AE>

type extractPayload<C> = C extends (i: unknown) => E.Either<any, infer A> ? A : never
type decodersToResource<DD> = { [S in keyof DD]: ResourceDone<S, extractPayload<DD[S]>> }
type decodersDictToResourceDone<
    DS extends ResourceDecoders,
    tagged = decodersToResource<DS>[keyof DS]
> = tagged extends undefined ? never : tagged
type ResourceDecoders = { [k in StatusCode]?: t.Decode<unknown, unknown> }

type ajaxToResourceSubject<AE = never> = AjaxResponse | ResourceFail<AE>
export type ajaxSubject<AE = never> = Observable<ajaxToResourceSubject<AE>>

const dict: { [k in AjaxErrorNames]: true } = {
    AjaxError: true,
    AjaxTimeoutError: true,
}

// utility

const isResourceFail = <AE>(r: any | ResourceFail<AE>): r is ResourceFail<AE> => r.tag === 'fail'

const isAjaxError = (e: any): e is AjaxError => Object.prototype.hasOwnProperty.call(dict, e.name)

interface DecodeError {
    key: string
    actual?: unknown
    requestType: string
}
type decodeErrors = Array<DecodeError>

const formatDecodeError = (es: t.Errors): decodeErrors =>
    es.reduce(
        (c, e) =>
            c.concat(e.context.map((b): DecodeError => ({ key: b.key, actual: b.actual, requestType: b.type.name }))),
        [] as decodeErrors
    )

const applyDecoder = <DS extends ResourceDecoders>(decoders: DS) => <AE>(
    response: AjaxResponse | AjaxError | ResourceFail<AE>
) => {
    if (isResourceFail(response)) {
        return response
    }

    const status = response.status as StatusCode
    const decoder = decoders[status]

    if (decoder) {
        return pipe(
            decoder(response.response),
            E.map(decoded => resourceDone(status, decoded) as decodersDictToResourceDone<DS>),
            E.getOrElse((e): decodersDictToResourceDone<DS> | ResourceFail<AE> =>
                resourceFail({
                    type: 'decodeError',
                    detail: formatDecodeError(e),
                })
            )
        )
    }

    return resourceFail<AE>({
        type: 'unexpectedResponse',
        detail: response,
    })
}

// combinator

export const ajaxToResource = <DS extends ResourceDecoders, AE = never>(
    ajax$: ajaxSubject<AE>,
    decoders: DS
): Observable<decodersDictToResourceDone<DS> | ResourceFail<AE> | ResourceSubmitted> =>
    concat(
        of(resourceSubmitted),
        ajax$.pipe(
            map(applyDecoder(decoders)),
            catchError(
                (e): Observable<decodersDictToResourceDone<DS> | ResourceFail<AE>> =>
                    of(isAjaxError(e) ? applyDecoder(decoders)(e) : resourceFail({ type: 'unknownError', detail: e }))
            )
        )
    ).pipe(take(2))

export const resourceFetcherToMutationEffect = <
    AJ extends (...args: any) => Observable<R>,
    SS extends S,
    S,
    I extends Array<any> = Parameters<AJ>,
    R = AJ extends (...args: any) => Observable<infer R> ? R : never
>(
    aj: AJ,
    apOperators: (i: Observable<R>, s: SS) => Observable<S>
) => (...i: I) => (s: SS): Observable<S> => aj(...i).pipe(switchMap(r => apOperators(of(r), s)))

// destructors

export const resourceFold = <DS extends ResourceDecoders, AE>(resource: Resource<DS, AE>) => <R>(dodo: {
    onInit: () => R
    onSubmitted: () => R
    onDone: (r: Extract<typeof resource, { tag: 'done' }>) => R
    onfail: (r: Extract<typeof resource, { tag: 'fail' }>) => R
}): R => {
    switch (resource.tag) {
        case 'init':
            return dodo.onInit()
        case 'submitted':
            return dodo.onSubmitted()
        case 'done':
            return dodo.onDone(resource)
        case 'fail':
            return dodo.onfail(resource)
    }
}
