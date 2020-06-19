import * as Mutoid from '../state'
import { Observable } from 'rxjs'
import { useCallback } from 'react'

export const useMutation = <S, P extends Array<any>>(
    s: Mutoid.Store<S>,
    mutation: Mutoid.Mutation<P, S>,
    notifierTakeUntil?: Observable<any>
) =>
    // can't eta reduction for warning eslint
    useCallback((...payload: P) => Mutoid.mutationRunner(s, mutation, notifierTakeUntil)(...payload), [
        s,
        mutation,
        notifierTakeUntil,
    ])
