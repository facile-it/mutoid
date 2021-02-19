import { useCallback, useState, useRef, useEffect } from 'react'
import type { Observable, Subscription } from 'rxjs'
import { map, takeUntil } from 'rxjs/operators'
import type * as OR from '../http/ObservableResource'
import * as MRE from '../http/Resource'

export function useResourceFetcher<
    F extends (...p: any) => OR.ObservableResource<E, A>,
    RE extends MRE.Resource<E, A>,
    MA extends ((r: MRE.ResourceAcknowledged<E, A>) => MR) | undefined,
    MR extends { _tag: unknown } = MA extends (...c: any) => any ? ReturnType<MA> : never,
    E = F extends (...p: any) => OR.ObservableResource<infer T, any> ? T : never,
    A = F extends (...p: any) => OR.ObservableResource<any, infer T> ? T : never,
    P extends Array<unknown> = Parameters<F>
>(
    fetch: F,
    options?: {
        notifierTakeUntil?: Observable<unknown>
        iniState?: RE
        mapAcknowledged?: MA
    }
): [MA extends undefined ? MRE.Resource<E, A> : MR | MRE.ResourceInit | MRE.ResourceSubmitted, (...p: P) => void] {
    const [value, setValue] = useState<unknown>(options?.iniState || MRE.init)

    const subscriptionRef = useRef<Subscription | null>(null)
    const fetchRef = useRef(fetch)
    const notifierTakeUntilRef = useRef(options?.notifierTakeUntil)
    const mapAcknowledgedRef = useRef(options?.mapAcknowledged)

    useEffect(() => {
        fetchRef.current = fetch
        notifierTakeUntilRef.current = options?.notifierTakeUntil
        mapAcknowledgedRef.current = options?.mapAcknowledged
    })

    return [
        value as any,
        useCallback((...p: P) => {
            if (subscriptionRef.current && subscriptionRef.current.closed !== true) {
                subscriptionRef.current.unsubscribe()
            }

            const resource$ = fetchRef.current(...p)

            const resourceTaken$ = notifierTakeUntilRef.current
                ? resource$.pipe(takeUntil(notifierTakeUntilRef.current))
                : resource$

            subscriptionRef.current = resourceTaken$
                .pipe(
                    map(s => {
                        return mapAcknowledgedRef.current && (s._tag === 'done' || s._tag === 'fail')
                            ? mapAcknowledgedRef.current(s)
                            : s
                    })
                )
                .subscribe(setValue)
        }, []),
    ]
}
