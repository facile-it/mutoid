import * as O from 'fp-ts/lib/Option'
import { Observable, of } from 'rxjs'
import { AjaxResponse } from 'rxjs/ajax'
import { map, switchMap } from 'rxjs/operators'
import { ajaxSubject, ajaxToResource, resourceFail } from '../../src/http'
import { ApiKey, sessionStore } from '../stores/sessionStore'

export type authAppError = string

export const fetchWithAuth = <DS, P extends Array<T>, T>(
    aj: (...a: P) => (t: ApiKey) => Observable<AjaxResponse>,
    decoders: DS
) => (...payload: P) =>
    ajaxToResource(
        sessionStore().state$.pipe(
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
