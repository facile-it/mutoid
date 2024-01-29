import { useCallback, useState, useRef, useEffect } from 'react'
import type { Observable } from 'rxjs'
import { takeUntil } from 'rxjs/operators'
import type * as OR from '../http/ObservableResource'
import * as RES from '../http/Resource'
import { useSubscriptionRef } from './useSubscriptionRef'

export function useFetchObservableResource<
    F extends (...p: any) => OR.ObservableResource<E, A>,
    E = F extends (...p: any) => OR.ObservableResource<infer T, any> ? T : never,
    A = F extends (...p: any) => OR.ObservableResource<any, infer T> ? T : never,
    P extends Array<unknown> = Parameters<F>,
>(
    fetch: F,
    options?: {
        notifierTakeUntil?: Observable<unknown>
        iniState?: RES.Resource<E, A>
    }
): [RES.Resource<E, A>, (...p: P) => void] {
    const [value, setValue] = useState<RES.Resource<E, A>>(options?.iniState || RES.init)
    const [subscriptionRef, subscriptionUnsubscribe] = useSubscriptionRef()

    const fetchRef = useRef(fetch)
    const notifierTakeUntilRef = useRef(options?.notifierTakeUntil)

    useEffect(() => {
        fetchRef.current = fetch
        notifierTakeUntilRef.current = options?.notifierTakeUntil
    }, [fetch, options])

    return [
        value,
        useCallback(
            (...p: P) => {
                subscriptionUnsubscribe()

                const resource$ = fetchRef.current(...p)

                const resourceTaken$ = notifierTakeUntilRef.current
                    ? resource$.pipe(takeUntil(notifierTakeUntilRef.current))
                    : resource$

                subscriptionRef.current = resourceTaken$.subscribe(setValue)
            },
            [subscriptionRef, subscriptionUnsubscribe]
        ),
    ]
}
