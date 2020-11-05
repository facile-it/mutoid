import { useCallback, useState, useRef, useEffect } from 'react'
import type { Observable, Subscription } from 'rxjs'
import { map, take, takeUntil } from 'rxjs/operators'
import { ResourceInit, resourceInit, Resource, ResourceSubmitted } from '../http'

export function useResourceFetcher<
    AR extends (...p: any) => Observable<any>,
    MR extends { tag: unknown },
    R = ReturnType<AR> extends Observable<infer S> ? S : never,
    P extends Array<unknown> = Parameters<AR>
>(
    ajaxToResource: AR,
    options: {
        notifierTakeUntil?: Observable<unknown>
        iniState?: R | ResourceInit
        mapAcknowledged: (r: Extract<R, { tag: 'fail' | 'done' }>) => MR
    }
): [MR | ResourceInit | ResourceSubmitted, (...p: P) => void]
export function useResourceFetcher<
    AR extends (...p: any) => Observable<any>,
    MR extends { tag: unknown },
    R = ReturnType<AR> extends Observable<infer S> ? S : never,
    P extends Array<unknown> = Parameters<AR>
>(
    ajaxToResource: AR,
    options?: {
        notifierTakeUntil?: Observable<unknown>
        iniState?: R | ResourceInit
        mapAcknowledged?: (r: Extract<R, { tag: 'fail' | 'done' }>) => MR
    }
): [R | ResourceInit, (...p: P) => void]
export function useResourceFetcher<
    AR extends (...p: any) => Observable<Resource<any, any>>,
    MR extends { tag: unknown },
    R = ReturnType<AR> extends Observable<infer S> ? S : never,
    P extends Array<unknown> = Parameters<AR>
>(
    ajaxToResource: AR,
    options?: {
        notifierTakeUntil?: Observable<unknown>
        iniState?: R | ResourceInit
        mapAcknowledged?: (r: unknown) => MR
    }
): [unknown, (...p: P) => void] {
    const [value, setValue] = useState<unknown>(options?.iniState || resourceInit)

    const subscriptionRef = useRef<Subscription | null>(null)
    const ajaxToResourcRef = useRef(ajaxToResource)
    const notifierTakeUntilRef = useRef(options?.notifierTakeUntil)
    const mapAcknowledgedRef = useRef(options?.mapAcknowledged)

    useEffect(() => {
        ajaxToResourcRef.current = ajaxToResource
        notifierTakeUntilRef.current = options?.notifierTakeUntil
        mapAcknowledgedRef.current = options?.mapAcknowledged
    })

    return [
        value,
        useCallback((...p: P) => {
            if (subscriptionRef.current && subscriptionRef.current.closed !== true) {
                subscriptionRef.current.unsubscribe()
            }

            const resource$ = ajaxToResourcRef.current(...p)

            const resourceTaken$ = notifierTakeUntilRef.current
                ? resource$.pipe(takeUntil(notifierTakeUntilRef.current))
                : resource$

            subscriptionRef.current = resourceTaken$
                .pipe(
                    take(2),
                    map(s => {
                        return mapAcknowledgedRef.current && (s.tag === 'done' || s.tag === 'fail')
                            ? mapAcknowledgedRef.current(s)
                            : s
                    })
                )
                .subscribe(setValue)
        }, []),
    ]
}
