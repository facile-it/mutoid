import type { Observable, Subscription } from 'rxjs'
import { expectType, expectError } from 'tsd'
import * as MS from '../src/state'

declare module '../src/state/stores' {
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

const d = MS.mutationRunner(storeString, () => mutation)
expectType<() => Subscription>(d)

const d1 = MS.mutationRunner(storeString, () => mutationWithOneParam)
expectType<(id: number) => Subscription>(d1)

const d2 = MS.mutationRunner(storeString, () => mutationWithTwoParam)
expectType<(id: number, name: string) => Subscription>(d2)

declare const storeNumber: MS.Store<'store_2', number>
declare const mutationString: {
    name: 'mutationString'
    effect: () => (s: number) => Observable<string>
}

expectError(MS.mutationRunner(storeNumber, () => mutationString))
