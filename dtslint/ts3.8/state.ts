/* eslint-disable @typescript-eslint/no-unused-vars */
import { Lazy } from 'fp-ts/function'
import { Observable } from 'rxjs'
import * as MS from '../../src/state'

declare module '../../src/state/stores' {
    interface Stores {
        store: 'mutation' | 'mutationWithOneParam' | 'mutationWithTwoParam'
        store_2: 'mutationString'
    }
}

declare const storeString: MS.Store<'store', string>
declare const mutation: {
    name: 'mutation'
    effect: () => (s: string) => Observable<string>
}
declare const mutationWithOneParam: {
    name: 'mutationWithOneParam'
    effect: (id: number) => (s: string) => Observable<string>
}
declare const mutationWithTwoParam: {
    name: 'mutationWithTwoParam'
    effect: (id: number, name: string) => (s: string) => Observable<string>
}

// $ExpectType () => Subscription
const d = MS.mutationRunner(storeString, () => mutation)

// $ExpectType (id: number) => Subscription
const d1 = MS.mutationRunner(storeString, () => mutationWithOneParam)

// $ExpectType (id: number, name: string) => Subscription
const d2 = MS.mutationRunner(storeString, () => mutationWithTwoParam)

declare const storeNumber: MS.Store<'store_2', number>
declare const mutationString: {
    name: 'mutationString'
    effect: () => (s: number) => Observable<string>
}

// $ExpectError
const e = MS.mutationRunner(storeNumber, () => mutationString)
