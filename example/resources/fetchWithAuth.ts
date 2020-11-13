import * as O from 'fp-ts/Option'
import * as R from 'fp-ts/Reader'
import type { Lazy } from 'fp-ts/function'
import { Observable, of } from 'rxjs'
import type { AjaxResponse } from 'rxjs/ajax'
import { map, switchMap, take } from 'rxjs/operators'
import * as MH from '../../src/http'
import type { ApiKey, SessionState } from '../stores/sessionStore'

export type authAppError = string

export const fetchWithAuth = R.asks(
    (deps: { store: Lazy<{ state$: Observable<SessionState> }> }) => <DS extends MH.ResourceDecoders>(
        aj: (t: ApiKey) => Observable<AjaxResponse>,
        decoders: DS
    ) =>
        MH.ajaxToResource(
            deps.store().state$.pipe(
                take(1),
                map(ss => (ss.status === 'done' ? O.some(ss.apiKey) : O.none)),
                switchMap(
                    O.fold(
                        (): MH.AjaxSubject<authAppError> =>
                            of(
                                MH.resourceAjaxFail({
                                    type: 'appError',
                                    detail: 'apiKey not found',
                                })
                            ),
                        aj
                    )
                )
            ),
            decoders
        )
)
