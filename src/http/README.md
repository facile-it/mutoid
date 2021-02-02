# Mutoid - Data fetching

In this section are exported two modules: `ObservableResource` and `Resource`. Two data structures that implement an instance of `Functor`, `Apply`, `Bifunctor`, `Applicative`, `Monad` (and `MonadObservable` for `ObservableResource`)

## fromAjax

```typescript
import * as t from 'io-ts'
import { AjaxCreationMethod } from 'rxjs/ajax'
import * as RRES from 'mutoid/http/ObservableResource'
import * as RES from 'mutoid/http/Resource'

export const somethingDecoders = {
    200: t.array(t.string).decode,
    400: t.string.decode,
}

type somethingResource = RES.ResourceTypeOf<typeof somethingDecoders>

const fetchSomething = (deps: { ajax: AjaxCreationMethod }) => (id: number, from: string) =>
    RRES.fromAjax(deps.ajax(`https://api.io?id=${id}&from=${from}`), somethingDecoders)
```

## toMutationEffect

```typescript
import { map } from 'rxjs/operators'
import * as RRES from 'mutoid/http/ObservableResource'
import * as MS from 'mutoid/state'

const fetchSomethingMutation = () =>
    MS.ctorMutation(
        'fetchSomethingMutation',
        RRES.toMutationEffect(fetchSomething, (o, s: state) => o.pipe(map(c => ({ ...s, something: c }))))
    )
```
