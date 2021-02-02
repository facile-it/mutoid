# Mutoid - React hooks

## useSelector

```typescript
const userName = useSelector(store, s => s.userName)
```

## useMutation

```typescript
const mutationR = useMutation(store, mutation)
```

## useResourceFetcher

```jsx
import * as React from 'react'
import { ajax } from 'rxjs/ajax'
import * as RES from 'mutoid/http/Resource'
import { pipe } from 'fp-ts/function'
import * as t from 'io-ts'

export const userDecoders = {
    200: t.type({
        name: t.string,
    }).decode,
}

const userFetcher = (id: number) => MH.ajaxToResource(ajax(`https://api.io/user/${id}`), userDecoders)

const App: React.FC<{ id: number }> = ({ id }) => {
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
                    RES.resourceFold({
                        onPending: () => 'loading...',
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
