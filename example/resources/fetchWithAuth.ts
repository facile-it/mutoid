import * as O from 'fp-ts/lib/Option'
import { AjaxResponse } from 'rxjs/ajax'
import { Observable, of } from 'rxjs'
import { Token, sessionStore } from '../stores/sessionStore'
import { ajaxSubject, ajaxToResource, resourceFail } from '../../src/http'
import { map, switchMap } from 'rxjs/operators'

export type authAppError = string

export const fetchWithAuth = <DS, P extends Array<any>>(
    aj: (...a: P) => (t: Token) => Observable<AjaxResponse>,
    decoders: DS
) => (...payload: P) =>
    ajaxToResource(
        sessionStore.state$.pipe(
            map(ss => ss.token),
            switchMap(
                O.fold(
                    (): ajaxSubject<authAppError> =>
                        of(
                            resourceFail({
                                type: 'appError',
                                detail: 'token not found',
                            })
                        ),
                    aj(...payload)
                )
            )
        ),
        decoders
    )
