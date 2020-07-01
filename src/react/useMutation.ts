import { Lazy } from 'fp-ts/lib/function'
import { useCallback } from 'react'
import { Observable, Subscription } from 'rxjs'
import * as Mutoid from '../state'

export const useMutation = <S, P extends Array<unknown>>(
    s: Lazy<Mutoid.Store<S>>,
    mutation: Mutoid.Mutation<P, S>,
    notifierTakeUntil?: Observable<unknown>
): ((...payload: P) => Subscription) =>
    // can't eta reduction for warning eslint
    useCallback((...payload: P) => Mutoid.mutationRunner(s, mutation, notifierTakeUntil)(...payload), [
        s,
        mutation,
        notifierTakeUntil,
    ])
