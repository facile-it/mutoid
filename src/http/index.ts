import * as E from 'fp-ts/lib/Either'
import * as t from 'io-ts'
import { AjaxError, AjaxResponse } from 'rxjs/ajax'
import { AjaxErrorNames } from 'rxjs/internal/observable/dom/AjaxObservable'
import { Observable, concat, of } from 'rxjs'
import { StatusCode } from './status'
import { catchError, map, switchMap, take } from 'rxjs/operators'
import { pipe } from 'fp-ts/lib/pipeable'

export type ResourceInit = {
    tag: 'init'
}

export type ResourceSubmitted = {
    tag: 'submitted'
}

export type ResourceDone<S, P> = {
    tag: 'done'
    status: S
    payload: P
}

// T extends string, D, AE extends { type: T, detail: D } = never
export type ResourceFail<AE = unknown> = {
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
        | {
              type: 'appError'
              detail: AE
          }
}

export const resourceInit: ResourceInit = { tag: 'init' }
export const resourceSubmitted: ResourceSubmitted = { tag: 'submitted' }
export const resourceDone = <S, P>(status: S, payload: P): ResourceDone<S, P> => ({
    tag: 'done',
    status: status,
    payload: payload,
})
export const resourceFail = <AE = unknown>(error: ResourceFail<AE>['error']): ResourceFail<AE> => ({
    tag: 'fail',
    error: error,
})

export type Resource<DS extends ResourceDecoders, AE = unknown> =
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

type ajaxToResourceSubject<AE = unknown> = AjaxResponse | ResourceFail<AE>
export type ajaxSubject<AE = unknown> = Observable<ajaxToResourceSubject<AE>>

export const ajaxToResource = <DS extends ResourceDecoders, AE>(
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

const dict: { [k in AjaxErrorNames]: true } = {
    AjaxError: true,
    AjaxTimeoutError: true,
}

const isResourceFail = <AE>(r: any | ResourceFail<AE>): r is ResourceFail<AE> => r.tag === 'fail'

const isAjaxError = (e: any): e is AjaxError => dict.hasOwnProperty(e.name)

export const resourceFetcherToMutation = <
    AJ extends (...args: any) => Observable<R>,
    S,
    O extends S,
    I extends Array<any> = Parameters<AJ>,
    R = AJ extends (...args: any) => Observable<infer R> ? R : never
>(
    aj: AJ,
    apOperators: (i: Observable<R>, s: S) => Observable<O>
) => (...i: I) => (s: S): Observable<O> => aj(...i).pipe(switchMap(r => apOperators(of(r), s)))

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

type decodeError = { key: string; actual?: unknown; requestType: string }
type decodeErrors = Array<decodeError>

const formatDecodeError = (es: t.Errors): decodeErrors =>
    es.reduce(
        (c, e) =>
            c.concat(e.context.map((b): decodeError => ({ key: b.key, actual: b.actual, requestType: b.type.name }))),
        [] as decodeErrors
    )
