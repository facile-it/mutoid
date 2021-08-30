---
sidebar_label: 'Data serializer'
sidebar_position: 6
---

# Data serializer

```ts
import * as DS from 'mutoid/http/dataSerializer'
```

Helper for serialize data (nullable or Option) to `URLSearchParams` or `FormData`.

You can use `URLSearchParams` for both browser and Node.js:

```typescript
import * as DS from 'mutoid/http/dataSerializer'
import { pipe } from 'fp-ts/function'

const queryString = pipe({ page: 2, id: 5 }, DS.serializeUrl(new URLSearchParams()), DS.toQueryString)
```

You can use `FormData` only for browser. For Node.js you can use [form-data](https://www.npmjs.com/package/form-data) or similar libraries.

```typescript
import * as DS from 'mutoid/http/dataSerializer'
import { pipe } from 'fp-ts/function'

const formData = pipe({ name: 'iacopo' }, DS.serializeForm(new FormData()))
```
