import { useCallback, useState, useRef, useEffect } from 'react'
import type { Observable, Subscription } from 'rxjs'
import { map, take, takeUntil } from 'rxjs/operators'
import {
    ResourceInit,
    resourceInit,
    ResourceSubmitted,
    ResourceDecoders,
    ResourceTypeOfStarted,
    ResourceTypeOfAcknowledged,
    ResourceTypeOf,
} from '../http'

export function useResourceFetcher<
    AR extends (...p: any) => Observable<ResourceTypeOfStarted<DS, EA>>,
    MR extends { _tag: unknown },
    IS extends ResourceTypeOf<DS, EA>,
    DS extends ResourceDecoders = ReturnType<AR> extends Observable<ResourceTypeOfStarted<infer S, any>> ? S : never,
    EA = ReturnType<AR> extends Observable<ResourceTypeOfStarted<DS, infer S>> ? S : never,
    P extends Array<unknown> = Parameters<AR>
>(
    ajaxToResource: AR,
    options: {
        notifierTakeUntil?: Observable<unknown>
        iniState?: IS
        mapAcknowledged: (r: ResourceTypeOfAcknowledged<DS, EA>) => MR
    }
): [MR | ResourceInit | ResourceSubmitted, (...p: P) => void]
export function useResourceFetcher<
    AR extends (...p: any) => Observable<ResourceTypeOfStarted<DS, EA>>,
    MR extends { _tag: unknown },
    IS extends ResourceTypeOf<DS, EA>,
    DS extends ResourceDecoders = ReturnType<AR> extends Observable<ResourceTypeOfStarted<infer S, any>> ? S : never,
    EA = ReturnType<AR> extends Observable<ResourceTypeOfStarted<DS, infer S>> ? S : never,
    P extends Array<unknown> = Parameters<AR>
>(
    ajaxToResource: AR,
    options?: {
        notifierTakeUntil?: Observable<unknown>
        iniState?: IS
        mapAcknowledged?: (r: ResourceTypeOfAcknowledged<DS, EA>) => MR
    }
): [ResourceTypeOf<DS, EA>, (...p: P) => void]
export function useResourceFetcher<
    AR extends (...p: any) => Observable<ResourceTypeOfStarted<DS, EA>>,
    MR extends { _tag: unknown },
    IS extends ResourceTypeOf<DS, EA>,
    DS extends ResourceDecoders = ReturnType<AR> extends Observable<ResourceTypeOfStarted<infer S, any>> ? S : never,
    EA = ReturnType<AR> extends Observable<ResourceTypeOfStarted<DS, infer S>> ? S : never,
    P extends Array<unknown> = Parameters<AR>
>(
    ajaxToResource: AR,
    options?: {
        notifierTakeUntil?: Observable<unknown>
        iniState?: IS
        mapAcknowledged?: (r: ResourceTypeOfAcknowledged<DS, EA>) => MR
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
                        return mapAcknowledgedRef.current && (s._tag === 'done' || s._tag === 'fail')
                            ? mapAcknowledgedRef.current(s)
                            : s
                    })
                )
                .subscribe(setValue)
        }, []),
    ]
}
