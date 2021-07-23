---
sidebar_label: 'Data serializer'
sidebar_position: 4
---

# Data serializer

```ts
import * as DS from 'mutoid/http/dataSerializer'
```

Helper for serialize data (nullable or Option) to URLSearchParams or FormData

```typescript
import * as DS from 'mutoid/http/dataSerializer'
import { pipe } from 'fp-ts/function'

const queryString = pipe({ page: 2, id: 5 }, DS.serializeUrl(new URLSearchParams()), DS.toQueryString)
```

You can use URLSearchParams on browser and NodeJs

```typescript
import * as DS from 'mutoid/http/dataSerializer'
import { pipe } from 'fp-ts/function'

const formData = pipe({ name: 'iacopo' }, DS.serializeForm(new FormData()))
```

You can use FormData only in browser, for NodeJs you can use something like [form-data](https://www.npmjs.com/package/form-data)
