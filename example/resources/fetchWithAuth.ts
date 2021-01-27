import type * as E from 'fp-ts/Either'
import * as O from 'fp-ts/Option'
import type { Lazy } from 'fp-ts/function'
import type * as t from 'io-ts'
import type { Observable } from 'rxjs'
import type { AjaxResponse } from 'rxjs/ajax'
import { map, switchMap, take } from 'rxjs/operators'
import * as RR from '../../src/http/ObservableResource'
import type { StatusCode } from '../../src/http/statusCode'
import type { ApiKey, SessionState } from '../stores/sessionStore'

export type authAppError = string

export const fetchWithAuth = (deps: { store: Lazy<{ state$: Observable<SessionState> }> }) => <
    K extends StatusCode,
    E extends t.Errors,
    DS extends {
        [k in K]?: (i: unknown) => E.Either<E, any>
    }
>(
    aj: (t: ApiKey) => Observable<AjaxResponse>,
    decoders: DS
) =>
    RR.fromAjax(
        deps.store().state$.pipe(
            take(1),
            map(ss => (ss.status === 'done' ? O.some(ss.apiKey) : O.none)),
            switchMap(
                O.fold(
                    (): RR.ObservableAjax<authAppError> =>
                        RR.ajaxFail({
                            type: 'appError',
                            detail: 'apiKey not found',
                        }),
                    aj
                )
            )
        ),
        decoders
    )
