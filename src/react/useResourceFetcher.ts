import { useCallback, useState, useRef } from 'react'
import type { Observable } from 'rxjs'
import { take, takeUntil } from 'rxjs/operators'
import { ResourceInit, resourceInit } from '../http'

export const useResourceFetcher = <
    AR extends (...p: any) => Observable<any>,
    R = ReturnType<AR> extends Observable<infer S> ? S : never,
    P extends Array<unknown> = Parameters<AR>
>(
    ajaxToResource: AR,
    notifierTakeUntil?: Observable<unknown>,
    iniState: R | ResourceInit = resourceInit
): [R | ResourceInit, (...p: P) => void] => {
    const [value, setValue] = useState<R | ResourceInit>(iniState)
    const ajaxToResourcR = useRef(ajaxToResource)

    return [
        value,
        useCallback(
            (...p: P) => {
                const resource$ = ajaxToResourcR.current(...p)

                const resourceTaken$ = notifierTakeUntil ? resource$.pipe(takeUntil(notifierTakeUntil)) : resource$

                resourceTaken$.pipe(take(2)).subscribe(setValue)
            },
            [notifierTakeUntil]
        ),
    ]
}
