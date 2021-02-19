import type { Lazy } from 'fp-ts/function'
import type { Observable } from 'rxjs'
import { map, take } from 'rxjs/operators'
import type * as ROE from '../../src/http/ReaderObservableResource'
import * as RES from '../../src/http/Resource'
import type { ApiKey, SessionState } from '../stores/sessionStore'

export type authAppError = string

export const fetchWithAuth: ROE.ReaderObservableResource<
    {
        store: Lazy<{ state$: Observable<SessionState> }>
    },
    RES.ResourceAjaxError<authAppError>,
    ApiKey
> = (deps: { store: Lazy<{ state$: Observable<SessionState> }> }) => {
    return deps.store().state$.pipe(
        take(1),
        map(ss =>
            ss.status === 'done'
                ? RES.done(ss.apiKey)
                : RES.ajaxFail<authAppError>({
                      type: 'appError',
                      detail: 'apiKey not found',
                  })
        )
    )
}
