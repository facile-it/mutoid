# Mutoid - State management

`import * as MS from 'mutoid/state'`

## Create store

```typescript
declare module 'mutoid/state/stores' {
    interface Stores {
        appStore: 'mutation' | 'partialMutation'
    }
}

const appStore = () => MS.ctor({ name: 'appStore', initState: { userName: 'Marco' } })
```

You can choose to use a singleton store or a lazy store. In some cases, to use a lazy store it's a better choice  
If you declare the store name and the mutation names with module augmentation, the notifier can inference the mutation name in the subject  
In any case, if you don't declare anything there is a fallback to string


## Read the status from anywhere

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

_If you use a lazy store, make sure to use the correct instance_

## Mutation

### ctorMutation

```typescript
declare const store: Store<S>
declare const id: number

const identityMutation = () => MS.ctorMutation('mutation', (id: number) => (currentState: S): Observable<S> => of(s))

const mutation = MS.mutationRunner(store, identityMutation)

// run
mutation(id)
```

_mutation with deps_

```typescript
declare const store: Store<S>
declare const id: number
declare const deps: {
    someService: someService
}

const identityMutation = (deps: typeof deps) =>
    MS.ctorMutation('mutation', (id: number) => (currentState: S): Observable<S> => of(s))

const mutation = MS.mutationRunner(store, identityMutation, { deps: { someService } })

// run
mutation(id)
```

### ctorPartialMutation

_mutation runs only if the state matches the predicate, useful if your store is a state machine_

```typescript
declare const store: Store<S>
declare const id: number

const identityPartialMutation = () =>
    MS.ctorPartialMutation(
        'partialMutation',
        (currentState: S): currentState is SS => currentState.type === 'ss',
        (id: number) => (currentState: SS): Observable<S> => of(s)
    )

const mutation = MS.mutationRunner(store, identityPartialMutation)

// run
mutation(id)
```

If you want to cancel the mutation `MS.mutationRunner` accept as third parameter "options" with propriety `notifierTakeUntil?: Observable<unknown>`

## Store notifier

emit: `initStore`, `mutationLoad`, `mutationStart`, `mutationEnd`

```typescript
declare const store: Store<S>

store.notifier$.subscribe(e =>
    Sentry.addBreadcrumb({
        category: 'mutation',
        message: action.type,
        level: Severity.Info,
        data: e,
    })
)
```
