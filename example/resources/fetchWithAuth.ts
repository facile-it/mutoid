import * as O from 'fp-ts/lib/Option'
import * as R from 'fp-ts/lib/Reader'
import type { Lazy } from 'fp-ts/lib/function'
import { Observable, of } from 'rxjs'
import type { AjaxResponse } from 'rxjs/ajax'
import { map, switchMap, take } from 'rxjs/operators'
import { ajaxSubject, ajaxToResource, resourceFail } from '../../src/http'
import type { ApiKey, SessionState } from '../stores/sessionStore'

export type authAppError = string

export const fetchWithAuth = R.asks(
    (deps: { store: Lazy<{ state$: Observable<SessionState> }> }) => <DS>(
        aj: (t: ApiKey) => Observable<AjaxResponse>,
        decoders: DS
    ) =>
        ajaxToResource(
            deps.store().state$.pipe(
                take(1),
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
                        aj
                    )
                )
            ),
            decoders
        )
)
