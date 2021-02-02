# Mutoid - Data fetching

`import * as MH from 'mutoid/http'`

##### ajaxToResource

```typescript
import * as t from 'io-ts'
import { AjaxCreationMethod } from 'rxjs/ajax'

export const somethingDecoders = {
    200: t.array(t.string).decode,
    400: t.string.decode,
}

type somethingResource = MH.Resource<typeof somethingDecoders>

const fetchSomething = (deps: { ajax: AjaxCreationMethod }) => (id: number, from: string) =>
    MH.ajaxToResource(deps.ajax(`https://api.io?id=${id}&from=${from}`), somethingDecoders)
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
import { flow } from 'fp-ts/function'

export const fetchSomethingMutation = flow(fetchSomething, fetch =>
    MS.ctorMutation(
        'fetchSomethingMutation' as const,
        MH.resourceFetcherToMutationEffect(fetch, (o, s: state) => o.pipe(map(c => ({ ...s, something: c }))))
    )
)
```
