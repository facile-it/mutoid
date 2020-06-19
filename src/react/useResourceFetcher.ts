import { Observable } from 'rxjs'
import { ResourceInit, resourceInit } from '../http'
import { take, takeUntil } from 'rxjs/operators'
import { useCallback, useState } from 'react'

export const useResourceFetcher = <
    AR extends (...p: any) => Observable<any>,
    R = ReturnType<AR> extends Observable<infer S> ? S : never,
    P extends Array<any> = Parameters<AR>
>(
    ajaxToResource: AR,
    notifierTakeUntil?: Observable<any>,
    iniState: R | ResourceInit = resourceInit
): [R | ResourceInit, (...p: P) => void] => {
    const [value, setValue] = useState<R | ResourceInit>(iniState)

    return [
        value,
        useCallback(
            (...p: P) => {
                const resource$ = ajaxToResource(...p)

                const resourceTaken$ = notifierTakeUntil ? resource$.pipe(takeUntil(notifierTakeUntil)) : resource$

                resourceTaken$.pipe(take(2)).subscribe(setValue)
            },
            [ajaxToResource, notifierTakeUntil]
        ),
    ]
}
