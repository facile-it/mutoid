# Upgrade to version 0.4

## New peer dependency

Now `fp-ts-rxjs` is a peer dependency

```sh
yarn add fp-ts-rxjs

// or

npm install fp-ts-rxjs
```

## State management

We removed the memoization in store ctor. 

Now we recommend to use a lazy store like

```ts
const appStore = () => MS.ctor({ name: 'appStore', initState: { userName: 'Marco' } })
```

In any case you can still use a singleton store. The only difference is the ctor first argument

```ts
// before
const appStore = MS.ctor(() => { name: 'appStore', initState: { userName: 'Marco' } })

// after
const appStore = MS.ctor({ name: 'appStore', initState: { userName: 'Marco' } })
```

And now when the store is built, it is no more lazy so you have to change some uses, for example

```ts
// before
store().state$.pipe(take(1), map(s => ...))

// after
store.state$.pipe(take(1), map(s => ...))
```

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
In any case, if you don't declare anything there is a fallback to string

## Data fetching

The http module has been splitted into 3 modules: `ReaderObservableResource`, `ObservableResource` and `Resource`. Three data structures that implement an instance of `Functor`, `Apply`, `Bifunctor`, `Applicative`, `Monad` (and `MonadObservable` for `ObservableResource` and `ReaderObservableResource`)

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
import * as ROR from 'mutoid/http/ReaderObservableResource'
import * as RES from 'mutoid/http/Resource'

export const somethingDecoders = {
    200: t.array(t.string).decode,
    400: t.string.decode,
}

export interface Deps {
    ajax: typeof ajax
}

type somethingResource = RES.ResourceTypeOf<typeof somethingDecoders>

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
import * as OR from 'mutoid/http/ObservableResource'
import * as ROR from 'mutoid/http/ReaderObservableResource'
import { pipe } from 'fp-ts/function'

// if fetchSomething = (params) => ObservableResource
// return () => Mutation

const fetchSomethingMutation = () =>
    pipe(
        fetchSomething,
        OR.fetchToMutationEffect((s: state) => c => ({ ...s, something: c })),
        MS.ctorMutationC('fetchSomethingMutation')
    )

// if fetchSomething = (params) => ReaderObservableResource
// return (deps) => Mutation

const fetchSomethingMutation = () =>
    pipe(
        fetchSomething,
        ROR.fetchToMutationEffectR((s: state) => c => ({ ...s, something: c })),
        MS.ctorMutationCR('fetchSomethingMutation')
    )
```

### Resource fold

Before

```ts
import * as MH from 'mutoid/http'
import { pipe } from 'fp-ts/function'

const result = pipe(
    userResource,
    MH.resourceFold({
        onInit: () => 'loading...',
        onSubmitted: () => 'loading...',
        onDone: r => r.payload.name,
        onFail: e => e.error.type,
    })
)
```

After

```ts
import * as RES from 'mutoid/http/Resource'
import { pipe } from 'fp-ts/function'

const result = pipe(
    userResource,
    RES.matchD({
        onInit: () => 'loading...',
        onSubmitted: () => 'loading...',
        onDone: r => r.payload.name,
        onFail: e => e.error.type,
    })
)

// or

const result = pipe(
    userResource,
    RES.matchD({
        onPending: () => 'loading...',
        onDone: r => r.payload.name,
        onFail: e => e.type,
    })
)

// or

const result = pipe(userResource, RES.match(onInit, onSubmitted, onDone, onFail))
```

The `ResourceDone` internal structure has been changed

Before

```ts
export interface ResourceDone<S, P> {
    readonly tag: 'done'
    readonly status: S
    readonly payload: P
}
```

After

```ts
export interface ResourceData<S, P> {
    readonly status: S
    readonly payload: P
}

export interface ResourceDone<D> {
    readonly _tag: 'done'
    readonly data: D
}
```

The discriminator now is `_tag`
