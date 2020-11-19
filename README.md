# Mutoid

Reactive library for state management, data fetching, caching (wip) with some utilities to use with _React_

---

### Installation

To install the last version

```sh
yarn add mutoid rxjs fp-ts
```

if you want to use [`io-ts`](https://github.com/gcanti/io-ts) decoder in data fetching

```sh
yarn add io-ts
```

if you want also to use with [`react`](https://github.com/facebook/react)

```sh
yarn add react-dom react
```

**Note** [`rxjs`](https://github.com/ReactiveX/rxjs), [`fp-ts`](https://github.com/gcanti/fp-ts), [`io-ts`](https://github.com/gcanti/io-ts), [`react`](https://github.com/facebook/react) are a peer dependency for `mutoid`

---

### State management

`import * as MS from 'mutoid/state'`

##### Create store

in ctor we use `memoization`

```typescript
const appStore = MS.ctor(() => ({ name: 'appStore' as const, initState: { userName: 'Marco' } }))
```

##### Read the status from anywhere

```typescript
import { pipe } from 'fp-ts/pipeable'
import * as T from 'fp-ts/Task'
import * as C from 'fp-ts/Console'

const program = pipe(
    MS.toTask(appStore),
    T.map(s => `Hello ${s.userName}`),
    T.chainIOK(C.log)
)

program()
```

##### Mutation -> mutationRunner

###### ctorMutation

```typescript
declare const store: Lazy<Store<S>>
declare const id: number

const mutation = () => MS.ctorMutation('mutation' as const, (id: number) => (currentState: S): Observable<S> => of(s))

const mutationR = MS.mutationRunner(store, mutation)
mutationR(id)
```

_mutation with deps_

```typescript
import * as R from 'fp-ts/Reader'

declare const store: Lazy<Store<S>>
declare const id: number
declare const deps: {
    someService: someService
}

const mutation = R.asks((deps: typeof deps) =>
    MS.ctorMutation('mutation' as const, (id: number) => (currentState: S): Observable<S> => of(s))
)

const mutationR = MS.mutationRunner(store, mutation, { deps: { someService } })
mutationR(id)
```

###### ctorPartialMutation

_mutation runs only if the state matches the predicate, useful if your store is a state machine_

```typescript
declare const store: Lazy<Store<S>>
declare const id: number

const mutation = () =>
    MS.ctorPartialMutation(
        'partialMutation' as const,
        (currentState: S): currentState is SS => currentState.type === 'ss',
        (id: number) => (currentState: SS): Observable<S> => of(s)
    )

const mutationR = MS.mutationRunner(store, mutation)
mutationR(id)
```

if you want to kill the mutation `MS.mutationRunner` accept as third parameter "options" with propriety `notifierTakeUntil?: Observable<unknown>`

##### Store notifier

emit: `initStore`, `mutationLoad`, `mutationStart`, `mutationEnd`

```typescript
declare const store: Lazy<Store<S>>

store().notifier$.subscribe(e =>
    Sentry.addBreadcrumb({
        category: 'mutation',
        message: action.type,
        level: Severity.Info,
        data: e,
    })
)
```

---

### Data fetching

`import * as MH from 'mutoid/http'`

##### ajaxToResource

```typescript
import * as t from 'io-ts'
import { AjaxCreationMethod } from 'rxjs/ajax'
import * as R from 'fp-ts/Reader'

export const somethingDecoders = {
    200: t.array(t.string).decode,
    400: t.string.decode,
}

type somethingResource = MH.Resource<typeof somethingDecoders>

const fetchSomething = R.asks((deps: { ajax: AjaxCreationMethod }) => (id: number, from: string) =>
    MH.ajaxToResource(deps.ajax(`https://api.io?id=${id}&from=${from}`), somethingDecoders)
)
```

##### resourceFetcherToMutationEffect

```typescript
import { map } from 'rxjs/operators'

const fetchSomethingMutation = () =>
    MS.ctorMutation(
        'fetchSomethingMutation' as const,
        MH.resourceFetcherToMutationEffect(fetchSomething, (o, s: state) => o.pipe(map(c => ({ ...s, something: c }))))
    )
```

_if fetchSomething has dependencies, you can do something like this_

```typescript
import { map } from 'rxjs/operators'
import { pipe } from 'fp-ts/function'
import * as R from 'fp-ts/Reader'

export const fetchSomethingMutation = pipe(
    fetchSomething,
    R.map(fetch =>
        MS.ctorMutation(
            'fetchSomethingMutation' as const,
            MH.resourceFetcherToMutationEffect(fetch, (o, s: state) => o.pipe(map(c => ({ ...s, something: c }))))
        )
    )
)
```

---

### Rxjs

#### Operatos

`import * as MRX from 'mutoid/rsjx'`

##### chainFirstIO

Perform a side effect and ignore the result

```typescript
const o = of(1).pipe(MRX.chainFirstIO((uno: number) => IO.of(uno + 2))) // 1
```

##### chainIOK

Perform a side effect and keep the result

```typescript
const o = of(1).pipe(MRX.chainIOK((uno: number) => IO.of(uno + 2))) // 3
```

##### runIO

```typescript
const o = of(IO.of(1)).pipe(MRX.runIO())
```

##### extractE

Squash left and right

```typescript
type e = E.either<L, R>
type result = L | R
```

#### Constructors

##### fromIO

```typescript
const i = IO.of(1)

const o = MRX.fromIO(i).pipe(...)
```

---

### React hooks

##### useSelector

```typescript
const userName = useSelector(store, s => s.userName)
```

##### useMutation

```typescript
const mutationR = useMutation(store, mutation)
```

##### useResourceFetcher

```jsx
import * as React from 'react'
import { ajax } from 'rxjs/ajax'
import * as MH from 'mutoid/http'
import { pipe } from 'fp-ts/function'
import * as t from 'io-ts'

export const userDecoders = {
    200: t.type({
        name: t.string,
    }).decode,
}

const userFetcher = (id: number) => MH.ajaxToResource(ajax(`https://api.io/user/${id}`), userDecoders)

const App: React.FC<{id: number}> = ({id}) => {
    const [userResource, dispatch] = useResourceFetcher(userFetcher)

    React.useEffect(() => {
        dispatch(id)
    }, [dispatch])

    return (
        <>
            <h1>Hello</h1>
            <p>
                {pipe(
                    userResource,
                    MH.resourceFold({
                        onInit: () => 'loading...',
                        onSubmitted: () => 'loading...',
                        onDone: r => r.payload.name,
                        onFail: e => e.error.type,
                    })
                )}
            </p>
            <button onClick={() => dispatch(id)} type="button">
                Refetch
            </button>
        </>
    )
}
```

---

### Run example

```console
yarn dev-server
```

---

### Test

##### Unit, lint and cs

```console
yarn test
```

##### Type level

```console
yarn test-type
```
