import { useCallback, useEffect, useRef } from 'react'
import type { Subscription } from 'rxjs'

export const useSubscriptionRef = (): [React.MutableRefObject<Subscription | null>, () => void] => {
    const subRef = useRef<Subscription | null>(null)

    const s = subRef.current

    useEffect(() => {
        return () => {
            if (s && s.closed !== true) {
                s.unsubscribe()
            }
        }
    }, [s])

    return [
        subRef,
        useCallback(() => {
            if (subRef.current && subRef.current.closed !== true) {
                subRef.current.unsubscribe()
            }
        }, []),
    ]
}
