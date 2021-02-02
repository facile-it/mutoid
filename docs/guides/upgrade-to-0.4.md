# Upgrade to version 0.4

## State management

We added `mutoid/state/stores` to populate the stores and mutations names using the module augmentation feature

```typescript
declare module 'mutoid/state/stores' {
    interface Stores {
        appStore: 'mutation' | 'partialMutation'
    }
}

const appStore = MS.ctor(() => ({
    name: 'appStore', // you can remove as const
    // nothing changed ...
}))

const mutation = MS.ctorMutation(
    'mutation' // you can remove as const
    // nothing changed ...
)
```

This is useful to have the correct inference in the store notifier

## Data fetching

The http module has been splitted into two modules: `ObservableResource`, `Resource`  
Two data structures that implement an instance of `Functor`, `Apply`, `Bifunctor`, `Applicative`, `Monad` (and `MonadObservable` for `ObservableResource`)

### Extract resource type form decoders

Before

```ts
import * as t from 'io-ts'
import * as MH from 'mutoid/http'

export const somethingDecoders = {
    200: t.array(t.string).decode,
    400: t.string.decode,
}

type somethingResource = MH.Resource<typeof somethingDecoders>
```

After

```ts
import * as t from 'io-ts'
import * as RES from 'mutoid/http/Resource'

export const somethingDecoders = {
    200: t.array(t.string).decode,
    400: t.string.decode,
}

type somethingResource = RES.ResourceTypeOf<typeof somethingDecoders>
```

### Create Observable resource from ajax

Before

```ts
import * as t from 'io-ts'
import { ajax } from 'rxjs/ajax'
import * as MH from 'mutoid/http'

export const somethingDecoders = {
    200: t.array(t.string).decode,
    400: t.string.decode,
}

type somethingResource = MH.Resource<typeof somethingDecoders>

const fetchSomething = (id: number, from: string) =>
    MH.ajaxToResource(ajax(`https://api.io?id=${id}&from=${from}`), somethingDecoders)
```

After

```ts
import * as t from 'io-ts'
import { ajax } from 'rxjs/ajax'
import * as RRES from 'mutoid/http/ObservableResource'
import * as RES from 'mutoid/http/Resource'

export const somethingDecoders = {
    200: t.array(t.string).decode,
    400: t.string.decode,
}

type somethingResource = RES.ResourceTypeOf<typeof somethingDecoders>

const fetchSomething = (id: number, from: string) =>
    RRES.fromAjax(ajax(`https://api.io?id=${id}&from=${from}`), somethingDecoders)
```

### Fetcher to mutation effect

Before

```ts
import { map } from 'rxjs/operators'
import * as MH from 'mutoid/http'
import * as MS from 'mutoid/state'

const fetchSomethingMutation = () =>
    MS.ctorMutation(
        'fetchSomethingMutation' as const,
        MH.resourceFetcherToMutationEffect(fetchSomething, (o, s: state) => o.pipe(map(c => ({ ...s, something: c }))))
    )
```

After

```ts
import * as t from 'io-ts'
import { ajax } from 'rxjs/ajax'
import * as RRES from 'mutoid/http/ObservableResource'

const fetchSomethingMutation = () =>
    MS.ctorMutation(
        'fetchSomethingMutation',
        RRES.toMutationEffect(fetchSomething, (o, s: state) => o.pipe(map(c => ({ ...s, something: c }))))
    )
```
