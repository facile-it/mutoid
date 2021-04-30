# Mutoid - React hooks

## useSelector

```typescript
const userName = useSelector(store, s => s.userName)
```

## useMutation

```typescript
const m = useMutation(store, mutation)
```

## useResourceFetcher

Deprecated use `useFetchObservableResource` or better `useFetchReaderObservableResource`

## useFetchReaderObservableResource

```jsx
import * as React from 'react'
import { ajax } from 'rxjs/ajax'
import * as RES from 'mutoid/http/Resource'
import * as ROR from 'mutoid/http/ReaderObservableResource'
import * as OR from 'mutoid/http/ObservableResource'
import { useFetchReaderObservableResource } from 'mutoid/react'
import { pipe } from 'fp-ts/function'
import * as t from 'io-ts'

export const userDecoders = {
    200: t.type({
        name: t.string,
    }).decode,
}

export const userFetcher = (id: number) => (deps: { ajax: typeof ajax }) =>
    OR.fromAjax(deps.ajax(`https://api.io/user/${id}`), userDecoders)

const App: React.FC<{ id: number }> = ({ id }) => {
    const [userResource, dispatch] = useFetchReaderObservableResource(userFetcher, { ajax })

    React.useEffect(() => {
        dispatch(id)
    }, [dispatch, id])

    return (
        <>
            <h1>Hello</h1>
            <p>
                {pipe(
                    userResource,
                    RES.matchD({
                        onPending: () => 'loading...',
                        onDone: r => r.payload.name,
                        onFail: e => e.type,
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

## useFetchObservableResource

Same as `useFetchReaderObservableResource`, the only difference is the input `ObservableResource` instead of `ReaderObservableResource`
