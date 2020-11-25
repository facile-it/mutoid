import { useCallback, useState, useRef, useEffect } from 'react'
import type { Observable, Subscription } from 'rxjs'
import { map, take, takeUntil } from 'rxjs/operators'
import {
    ResourceInit,
    resourceInit,
    ResourceSubmitted,
    ResourceDecoders,
    ResourceStarted,
    ResourceAcknowledged,
    Resource,
} from '../http'

export function useResourceFetcher<
    AR extends (...p: any) => Observable<ResourceStarted<DS, EA>>,
    MR extends { tag: unknown },
    IS extends Resource<DS, EA>,
    DS extends ResourceDecoders = ReturnType<AR> extends Observable<ResourceStarted<infer S, any>> ? S : never,
    EA = ReturnType<AR> extends Observable<ResourceStarted<DS, infer S>> ? S : never,
    P extends Array<unknown> = Parameters<AR>
>(
    ajaxToResource: AR,
    options: {
        notifierTakeUntil?: Observable<unknown>
        iniState?: IS
        mapAcknowledged: (r: ResourceAcknowledged<DS, EA>) => MR
    }
): [MR | ResourceInit | ResourceSubmitted, (...p: P) => void]
export function useResourceFetcher<
    AR extends (...p: any) => Observable<ResourceStarted<DS, EA>>,
    MR extends { tag: unknown },
    IS extends Resource<DS, EA>,
    DS extends ResourceDecoders = ReturnType<AR> extends Observable<ResourceStarted<infer S, any>> ? S : never,
    EA = ReturnType<AR> extends Observable<ResourceStarted<DS, infer S>> ? S : never,
    P extends Array<unknown> = Parameters<AR>
>(
    ajaxToResource: AR,
    options?: {
        notifierTakeUntil?: Observable<unknown>
        iniState?: IS
        mapAcknowledged?: (r: ResourceAcknowledged<DS, EA>) => MR
    }
): [Resource<DS, EA>, (...p: P) => void]
export function useResourceFetcher<
    AR extends (...p: any) => Observable<ResourceStarted<DS, EA>>,
    MR extends { tag: unknown },
    IS extends Resource<DS, EA>,
    DS extends ResourceDecoders = ReturnType<AR> extends Observable<ResourceStarted<infer S, any>> ? S : never,
    EA = ReturnType<AR> extends Observable<ResourceStarted<DS, infer S>> ? S : never,
    P extends Array<unknown> = Parameters<AR>
>(
    ajaxToResource: AR,
    options?: {
        notifierTakeUntil?: Observable<unknown>
        iniState?: IS
        mapAcknowledged?: (r: ResourceAcknowledged<DS, EA>) => MR
    }
): [unknown, (...p: P) => void] {
    const [value, setValue] = useState<unknown>(options?.iniState || resourceInit)

    const subscriptionRef = useRef<Subscription | null>(null)
    const ajaxToResourceRef = useRef(ajaxToResource)
    const notifierTakeUntilRef = useRef(options?.notifierTakeUntil)
    const mapAcknowledgedRef = useRef(options?.mapAcknowledged)

    useEffect(() => {
        ajaxToResourceRef.current = ajaxToResource
        notifierTakeUntilRef.current = options?.notifierTakeUntil
        mapAcknowledgedRef.current = options?.mapAcknowledged
    })

    return [
        value,
        useCallback((...p: P) => {
            if (subscriptionRef.current && subscriptionRef.current.closed !== true) {
                subscriptionRef.current.unsubscribe()
            }

            const resource$ = ajaxToResourceRef.current(...p)

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
