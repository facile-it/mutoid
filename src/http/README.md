# Mutoid - Data fetching

## ReaderObservableResource, ObservableResource, Resource

Three data structures that implement an instance of `Functor`, `Apply`, `Bifunctor`, `Applicative`, `Monad` (and `MonadObservable` for `ObservableResource` and `ReaderObservableResource`)

### fromAjax

Build ReaderObservableResource from ajax

```typescript
import * as t from 'io-ts'
import { ajax } from 'rxjs/ajax'
import * as ROR from 'mutoid/http/ReaderObservableResource'
import * as OR from 'mutoid/http/ObservableResource'
import * as RES from 'mutoid/http/Resource'

export interface Deps {
    ajax: typeof ajax
}

export const somethingDecoders = {
    200: t.array(t.string).decode,
    400: t.string.decode,
}

type somethingResource = RES.ResourceTypeOf<typeof somethingDecoders>

const fetchSomething = (id: number, from: string) => (deps: Deps) =>
    OR.fromAjax(deps.ajax(`https://api.io?id=${id}&from=${from}`), somethingDecoders)

// or

export const fetchSomething = (id: number, from: string) =>
    pipe(
        ROR.askTypeOf<Deps, typeof somethingDecoders>(),
        ROR.chainW(deps =>
            ROR.fromAjax(
                deps.ajax(`https://ron-swanson-quotes.herokuapp.com/v2/quotes?id=${id}&from=${from}`),
                somethingDecoders
            )
        )
    )
```

### toMutationEffect

From ObservableResource

```typescript
import { map } from 'rxjs/operators'
import * as OR from 'mutoid/http/ObservableResource'
import * as MS from 'mutoid/state'

type fetchQuoteMutationWithParams = () => MS.Mutation<
    'fetchSomethingMutation',
    [id: number, from: string],
    QuoteState,
    QuoteState
>

export const fetchQuoteMutationWithParams = pipe(
    fetchSomething, // (id: number, from: string) => OR.ObservableResource<E, A>
    OR.fetchToMutationEffect((s: QuoteState) => (quote): QuoteState => ({ ...s, something: c })),
    MS.ctorMutationC('fetchSomethingMutation')
)
```

From ReaderObservableResource

```typescript
import { map } from 'rxjs/operators'
import * as ROR from 'mutoid/http/ReaderObservableResource'
import * as MS from 'mutoid/state'

type fetchQuoteMutationWithParams = (
    d: Deps
) => MS.Mutation<'fetchSomethingMutation', [id: number, from: string], QuoteState, QuoteState>

export const fetchQuoteMutationWithParams = pipe(
    fetchSomething, // (id: number, from: string) => ROR.ReaderObservableResource<R, E, A>
    ROR.fetchToMutationEffectR((s: QuoteState) => (quote): QuoteState => ({ ...s, something: c })),
    MS.ctorMutationCR('fetchSomethingMutation')
)
```

## DataSerializer

Module for serialize data (nullable or Option) to URLSearchParams or FormData

```typescript
import * as DS from 'mutoid/http/dataSerializer'

const queryString = pipe({ page: 2, id: 5 }, DS.serializeUrl(new URLSearchParams()), DS.toQueryString)
```

You can use URLSearchParams on browser and NodeJs

```typescript
import * as DS from 'mutoid/http/dataSerializer'

const queryString = pipe({ name: 'iacopo' }, DS.serializeForm(new FormData()))
```

You can use FormData only in browser, for NodeJs you can use something like [form-data](https://www.npmjs.com/package/form-data)
