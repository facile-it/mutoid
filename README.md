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

`import * as MS from 'mutoid/lib/state'`

##### Create store

in ctor we use `memoization`

```typescript
const appStore = MS.ctor(() => ({ name: 'appStore' as const, initState: { userName: 'Marco' } }))
```

##### Read the status from anywhere

```typescript
import { pipe } from 'fp-ts/lib/pipeable'
import * as T from 'fp-ts/lib/Task'
import * as C from 'fp-ts/lib/Console'

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

declare const mutation: MS.ctorMutation(
    'mutation' as const,
    (id: number) => (currentState: S) => Observable<S>
)

const mutationR = MS.mutationRunner(appStore, mutation)
mutationR(id)
```

###### ctorPartialMutation

_mutation runs only if the state matches the predicate, useful if your store is a state machine_

```typescript
declare const store: Lazy<Store<S>>
declare const id: number

declare const mutation: MS.ctorPartialMutation(
    'partialMutation' as const,
    (currentState: S): currentState is SS => currentState.type === 'ss',
    (id: number) => (currentState: SS) => Observable<S>
)

const mutationR = MS.mutationRunner(appStore, mutation)
mutationR(id)
```

if you want to kill the mutation `MS.mutationRunner` accept as third parameter `notifierTakeUntil?: Observable<unknown>`

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

`import * as MH from 'mutoid/lib/http'`

##### ajaxToResource

```typescript
import * as t from 'io-ts'
import { ajax } from 'rxjs/ajax'

export const somethingDecoders = {
    200: t.array(t.string).decode,
    400: t.string.decode,
}

export type somethingResource = MH.Resource<typeof somethingDecoders>

export const fetchSomething = () => MH.ajaxToResource(ajax('https://api.io'), somethingDecoders)
```

##### resourceFetcherToMutationEffect

```typescript
import { map } from 'rxjs/operators'

export const fetchSomethingMutation = MS.ctorMutation(
    'fetchSomethingMutation' as const,
    MH.resourceFetcherToMutationEffect(fetchSomething, (o, s: state) => o.pipe(map(c => ({ ...s, something: c }))))
)
```

---

### Rxjs operatos

`import * as MRX from 'mutoid/lib/rsjx'`

##### chainFirstIO

Perform a side effect and ignore the result

```typescript
const o = of(1).pipe(MRX.chainFirstIO((uno: number) => IO.of(uno + 2)) // 1
```

##### chainIOK

Perform a side effect and keep the result

```typescript
const o = of(1).pipe(MRX.chainIOK((uno: number) => IO.of(uno + 2))) // 3
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

```typescript
import { ajax } from 'rxjs/ajax'
import * as MH from 'mutoid/lib/http'

const somethingFetcher = () => MH.ajaxToResource(ajax('https://api.io'), decoders)

const [resource, dispatch] = useResourceFetcher(fetchSomething, iniState)
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
