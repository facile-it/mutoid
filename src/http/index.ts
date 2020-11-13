import * as E from 'fp-ts/Either'
import { pipe } from 'fp-ts/pipeable'
import { Observable, concat, of } from 'rxjs'
import type { AjaxError, AjaxResponse } from 'rxjs/ajax'
// eslint-disable-next-line rxjs/no-internal
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

export interface ResourceFail<AE = never, DE = unknown> {
    tag: 'fail'
    error:
        | {
              type: 'decodeError'
              detail: DE
          }
        | {
              type: 'networkError'
              detail: AjaxError
          }
        | {
              type: 'unexpectedResponse'
              detail: AjaxResponse | AjaxError
          }
        | ResourceAjaxFail<AE>['error']
}

export interface ResourceAjaxFail<AE = never> {
    tag: 'fail'
    error:
        | {
              type: 'unknownError'
              detail: unknown
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
export const resourceFail = <AE = never, DE = unknown>(error: ResourceFail<AE, DE>['error']): ResourceFail<AE, DE> => ({
    tag: 'fail',
    error: error,
})
export const resourceAjaxFail = <AE = never>(error: ResourceAjaxFail<AE>['error']): ResourceAjaxFail<AE> => ({
    tag: 'fail',
    error: error,
})

export type Resource<DS extends ResourceDecoders, AE = never> = ResourceInit | ResourceRunned<DS, AE>
export type ResourceRunned<DS extends ResourceDecoders, AE = never> = ResourceSubmitted | ResourceAcked<DS, AE>
export type ResourceAcked<DS extends ResourceDecoders, AE = never> =
    | DecodersDictToResourceDone<DS>
    | DecodersDictToResourceFail<DS, AE>

type ExtractRight<C> = C extends (i: unknown) => E.Either<any, infer A> ? A : never
type DecodersToResourceDone<DS> = { [S in keyof DS]: ResourceDone<S, ExtractRight<DS[S]>> }
type DecodersDictToResourceDone<
    DS extends ResourceDecoders,
    RD = DecodersToResourceDone<DS>[keyof DS]
> = RD extends undefined ? never : RD

type ExtractLeft<C> = C extends (i: unknown) => E.Either<infer A, any> ? A : never
type DecodersToResourceFail<DS, AE> = { [S in keyof DS]: ResourceFail<AE, ExtractLeft<DS[S]>> }
type DecodersDictToResourceFail<
    DS extends ResourceDecoders,
    AE,
    RF = DecodersToResourceFail<DS, AE>[keyof DS]
> = RF extends undefined ? never : RF

export type ResourceDecoders = { [k in StatusCode]?: (i: unknown) => E.Either<unknown, unknown> }

export type AjaxSubject<AE = never> = Observable<AjaxResponse | ResourceAjaxFail<AE>>

const dict: { [k in AjaxErrorNames]: true } = {
    AjaxError: true,
    AjaxTimeoutError: true,
}

// utility

const isResourceAjaxFail = <AE>(r: any | ResourceAjaxFail<AE>): r is ResourceAjaxFail<AE> => r.tag === 'fail'

const isAjaxError = (e: any): e is AjaxError => Object.prototype.hasOwnProperty.call(dict, e.name)

const applyDecoder = <DS extends ResourceDecoders>(decoders: DS) => <AE>(
    response: AjaxResponse | AjaxError | ResourceAjaxFail<AE>
): ResourceAcked<DS, AE> => {
    if (isResourceAjaxFail(response)) {
        return response as DecodersDictToResourceFail<DS, AE>
    }

    const status = response.status as StatusCode
    const decoder = decoders[status]

    if (decoder) {
        return pipe(
            decoder(response.response),
            E.map(decoded => resourceDone(status, decoded) as DecodersDictToResourceDone<DS>),
            E.getOrElseW(
                e =>
                    resourceFail({
                        type: 'decodeError',
                        detail: e,
                    }) as DecodersDictToResourceFail<DS, AE>
            )
        )
    }

    return resourceFail({
        type: 'unexpectedResponse',
        detail: response,
    }) as DecodersDictToResourceFail<DS, AE>
}

// combinator

export const ajaxToResource = <DS extends ResourceDecoders, AE = never>(
    ajax$: AjaxSubject<AE>,
    decoders: DS
): Observable<ResourceRunned<DS, AE>> =>
    concat(
        of(resourceSubmitted),
        ajax$.pipe(
            map(applyDecoder(decoders)),
            catchError(
                (e: unknown): Observable<ResourceAcked<DS, AE>> =>
                    of(
                        isAjaxError(e)
                            ? applyDecoder(decoders)(e)
                            : (resourceFail({ type: 'unknownError', detail: e }) as DecodersDictToResourceFail<DS, AE>)
                    )
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

export const resourceFold = <DS extends ResourceDecoders, AE, R>(dodo: {
    onInit: () => R
    onSubmitted: () => R
    onDone: (r: Extract<Resource<DS, AE>, { tag: 'done' }>) => R
    onFail: (r: Extract<Resource<DS, AE>, { tag: 'fail' }>) => R
}) => (resource: Resource<DS, AE>) => {
    switch (resource.tag) {
        case 'init':
            return dodo.onInit()
        case 'submitted':
            return dodo.onInit()
        case 'done':
            return dodo.onDone(resource)
        case 'fail':
            return dodo.onFail(resource)
    }
}

export const resourceFold_ = <DS extends ResourceDecoders, AE>(resource: Resource<DS, AE>) => <R>(dodo: {
    onInit: () => R
    onSubmitted: () => R
    onDone: (r: Extract<Resource<DS, AE>, { tag: 'done' }>) => R
    onFail: (r: Extract<Resource<DS, AE>, { tag: 'fail' }>) => R
}): R => pipe(resource, resourceFold<DS, AE, R>(dodo))
