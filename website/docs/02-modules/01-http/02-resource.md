---
sidebar_label: 'Resource'
sidebar_position: 2
---

# Resource

```ts
import * as RES from 'mutoid/http/Resource'
import * as OR from 'mutoid/http/ObservableResource'
import * as ROR from 'mutoid/http/ReaderObservableResource'
```

**ReaderObservableResource**, **ObservableResource**, **Resource** are three data structures that implement an instance of _Functor_, _Apply_, _Bifunctor_, _Applicative_, _Monad_ (and _MonadObservable_ for _ObservableResource_ and _ReaderObservableResource_)

All modules have the same structure (more or less) as a fp-ts module:

-   constructor
-   destructors
-   combinators
-   type class members
-   instances

## Resource

Resource, that is the basic data structures, is a sum type that represents all possible cases of async provisioning of data.

-   _ResourceInit_: nothing happened
-   _ResourceSubmitted_: the asynchronous request has started
-   _ResourceDone_: the asynchronous request **has** terminated in an **expected state**
-   _ResourceFail_: the asynchronous request **hasn't** terminated in an **expected state**

## Constructors

There are some classic constructors and some helper constructors from data structure `IO`, `Task`, `Either`, etc..

### fromAjax

One of the most important and (hopefully) useful constructor implemented in ReaderObservableResource and ObservableResource

The inputs are: **ObservableAjax** and **ResourceDecoders**

\>> `ObservableAjax`

```ts
import * as RES from 'mutoid/http/Resource'
import { AjaxError } from 'rxjs/ajax'
import { Observable } from 'rxjs'

type ObservableAjax<AE = never> = Observable<AjaxResponse | RES.ResourceAjaxFail<AE>>
```

Where:

-   `AjaxResponse` is A normalized response from an AJAX request [defined in rxjs](https://rxjs-dev.firebaseapp.com/api/ajax/AjaxResponse)
-   `ResourceAjaxFail` is a sum type defined with two cases `unknownError` and `appError` (you can find a constructor in Resource)

\>> `ResourceDecoders`

```ts
import { Either } from 'fp-ts/Either'
import { StatusCode } from 'mutoid/http/statusCode'

type ResourceDecoders = { [k in StatusCode]?: (i: unknown) => Either<unknown, unknown> }
```

You can use `io-ts` to build easily the decoders

#### Example

```typescript
import * as t from 'io-ts'
import { ajax } from 'rxjs/ajax'
import * as ROR from 'mutoid/http/ReaderObservableResource'
import * as OR from 'mutoid/http/ObservableResource'
import * as RES from 'mutoid/http/Resource'
import { pipe } from 'fp-ts/function'

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

When you use `fromAjax`, we consider all status code in the decoder dictionary as a `Done` case.

In that case the done resource data is described by a sum type

```ts
interface ResourceData<S, P> {
    readonly status: S
    readonly payload: P
}
```

where status and payload are inferred from your decoder dictionary

Instead the fail resource data is described by a sum type that has (4+1) cases:

-   `unknownError`
-   `decodeError` errors are inferred from your decoder dictionary
-   `networkError`
-   `unexpectedResponse` all status code that you don't specify in decoder dictionary
-   `appError` inferred if you specify that

If you want to see some examples:

1 - simple fetch with token in store: [example](https://github.com/facile-it/mutoid/blob/pre_release_04/example/resources/quoteResource.ts#L23)  
2 - fetch in series: [example](https://github.com/facile-it/mutoid/blob/pre_release_04/example/resources/quoteResource.ts#L42)  
3 - fetch in parallel: [example](https://github.com/facile-it/mutoid/blob/pre_release_04/example/resources/quoteResource.ts#L54)

## Destructors

### match (Resource)

Take 4 functions for each case: `onInit`, `onSubmitted`, `onDone`, `onFail`

### matchD (Resource)

Same of `match` but with different input

```ts
{
    onInit: () => R
    onSubmitted: () => R
    onDone: (r: A) => R
    onFail: (r: E) => R
}

// or

{
    onPending: () => R
    onDone: (r: A) => R
    onFail: (r: E) => R
}
```

### toMutationEffect (ReaderObservableResource, ObservableResource)

This destructor is useful when you want to update a store after an asynchronous request.
Implemented in ReaderObservableResource and ObservableResource

In ObservableResource

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

In ReaderObservableResource

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
