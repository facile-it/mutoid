import * as O from 'fp-ts/lib/Option'
import * as R from 'fp-ts/lib/Reader'
import { Lazy } from 'fp-ts/lib/function'
import { Observable, of } from 'rxjs'
import { AjaxResponse } from 'rxjs/ajax'
import { map, switchMap } from 'rxjs/operators'
import { ajaxSubject, ajaxToResource, resourceFail } from '../../src/http'
import { ApiKey, SessionState } from '../stores/sessionStore'

export type authAppError = string

export const fetchWithAuth = R.asks(
    (deps: { store: Lazy<{ state$: Observable<SessionState> }> }) => <DS, P extends Array<T>, T>(
        aj: (...a: P) => (t: ApiKey) => Observable<AjaxResponse>,
        decoders: DS
    ) => (...payload: P) =>
        ajaxToResource(
            deps.store().state$.pipe(
                map(ss => (ss.status === 'done' ? O.some(ss.apiKey) : O.none)),
                switchMap(
                    O.fold(
                        (): ajaxSubject<authAppError> =>
                            of(
                                resourceFail({
                                    type: 'appError',
                                    detail: 'apiKey not found',
                                })
                            ),
                        aj(...payload)
                    )
                )
            ),
            decoders
        )
)
