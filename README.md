# Mutoid

Reactive library for state management, data fetching, caching (wip) with some utilities to use with _React_

---

### Installation

To install the last version

```sh
yarn add mutoid rxjs fp-ts
```

if you want use [`io-ts`](https://github.com/gcanti/io-ts) decoder in data fetching

```sh
yarn add io-ts
```

if you want also use with [`react`](https://github.com/facebook/react)

```sh
yarn add react-dom react
```

**Note** [`rxjs`](https://github.com/ReactiveX/rxjs), [`fp-ts`](https://github.com/gcanti/fp-ts), [`io-ts`](https://github.com/gcanti/io-ts), [`react`](https://github.com/facebook/react) are a peer dependency for `mutoid`

---

### State management

`import * as MS from 'mutoid/lib/state'`

**Create store**

```typescript
const appStore = MS.of({ userName: 'Marco' })
```

**Read the status from anywhere**

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

**Run mutation**

```typescript
declare const store: Store<S>
declare const mutation: Mutation<(id: number) => (currentState: S) => Observable<S>>
declare const id: number

const runMutation = MS.mutationRunner(appStore, mutation)
runMutation(id)
```

---

### Data fetching

`import * as MH from 'mutoid/lib/http'`

**ajaxToResource**

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

**resourceFetcherToMutation**

```typescript
import { map } from 'rxjs/operators'

export const fetchSomethingMutation = MH.resourceFetcherToMutation(fetchSomething, (o, s: state) =>
    o.pipe(map(c => ({ ...s, something: c })))
)
```

---

### React hooks

**useSelector**

```typescript
const userName = useSelector(appStore, s => s.userName)
```

**useMutation**

```typescript
const fetchQuoteRunner = useMutation(appStore, mutation)
```

**useResourceFetcher**

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

**Unit, lint and cs**

```console
yarn test
```

**Type level**

```console
yarn test-type
```
