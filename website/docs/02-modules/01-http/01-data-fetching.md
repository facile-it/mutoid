---
sidebar_label: 'Data fetching'
sidebar_position: 1
---

# Data fetching

The main purpose of this module, it's expose an ADT (algebraic data type) for managing the response of http calls

We don't consider safe design, something like this:

```ts
const { data, error } = fetch('/api/user')
```

### Module content

-   [Resource](./resource) _the ADT_
-   [Fetch factory and cache](./fetch-factory-and-cache) _helper for standardize responses and cache_
-   [Data serializer](./data-serializer) _helper for serialize data_

### Deep dive

-   [Slaying a ui antipattern](https://medium.com/javascript-inside/slaying-a-ui-antipattern-in-fantasyland-907cbc322d2a)
-   [Milano TS - Algebraic Data Type](https://www.youtube.com/watch?v=rs8rzYmKzVE) _vidoe ita_
