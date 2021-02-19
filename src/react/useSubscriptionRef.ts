import { useCallback, useEffect, useRef } from 'react'
import type { Subscription } from 'rxjs'

export const useSubscriptionRef = (): [React.MutableRefObject<Subscription | null>, () => void] => {
    const subRef = useRef<Subscription | null>(null)

    useEffect(() => {
        return () => {
            if (subRef.current && subRef.current.closed !== true) {
                // eslint-disable-next-line react-hooks/exhaustive-deps
                subRef.current.unsubscribe()
            }
        }
    }, [])

    return [
        subRef,
        useCallback(() => {
            if (subRef.current && subRef.current.closed !== true) {
                subRef.current.unsubscribe()
            }
        }, []),
    ]
}
