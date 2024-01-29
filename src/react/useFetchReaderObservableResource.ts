import { useCallback, useState, useRef, useEffect } from 'react'
import type { Observable } from 'rxjs'
import { takeUntil } from 'rxjs/operators'
import type * as ROR from '../http/ReaderObservableResource'
import * as RES from '../http/Resource'
import { useSubscriptionRef } from './useSubscriptionRef'

export function useFetchReaderObservableResource<
    F extends (...p: any) => ROR.ReaderObservableResource<R, E, A>,
    R = F extends (...p: any) => ROR.ReaderObservableResource<infer T, any, any> ? T : never,
    E = F extends (...p: any) => ROR.ReaderObservableResource<any, infer T, any> ? T : never,
    A = F extends (...p: any) => ROR.ReaderObservableResource<any, any, infer T> ? T : never,
    P extends Array<unknown> = Parameters<F>,
>(
    fetch: F,
    deps: R,
    options?: {
        notifierTakeUntil?: Observable<unknown>
        iniState?: RES.Resource<E, A>
    }
): [RES.Resource<E, A>, (...p: P) => void, () => void] {
    const [value, setValue] = useState<RES.Resource<E, A>>(options?.iniState ?? RES.init)
    const [subscriptionRef, subscriptionUnsubscribe] = useSubscriptionRef()

    const fetchRef = useRef(fetch)
    const depsRef = useRef(deps)
    const optionsRef = useRef(options)

    useEffect(() => {
        fetchRef.current = fetch
        depsRef.current = deps
        optionsRef.current = options
    }, [fetch, deps, options])

    const dispatch = useCallback(
        (...p: P) => {
            subscriptionUnsubscribe()

            const resource$ = fetchRef.current(...p)(depsRef.current)

            const resourceTaken$ = optionsRef.current?.notifierTakeUntil
                ? resource$.pipe(takeUntil(optionsRef.current.notifierTakeUntil))
                : resource$

            subscriptionRef.current = resourceTaken$.subscribe(setValue)
        },
        [subscriptionRef, subscriptionUnsubscribe]
    )

    const resetState = useCallback(() => {
        setValue(optionsRef.current?.iniState ?? RES.init)
    }, [])

    return [value, dispatch, resetState]
}
