---
sidebar_label: 'Data fetching'
sidebar_position: 1
---

# Data fetching

The main purpose of this module, is to expose an ADT (algebraic data type) to manage the response of http calls

We don't consider safe design, like this one:

```ts
const { data, error } = fetch('/api/user')
```

### Deep dive

-   [Slaying a ui antipattern](https://medium.com/javascript-inside/slaying-a-ui-antipattern-in-fantasyland-907cbc322d2a)
-   [Milano TS - Algebraic Data Type](https://www.youtube.com/watch?v=rs8rzYmKzVE) _video ita_
