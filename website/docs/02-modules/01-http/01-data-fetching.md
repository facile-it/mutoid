---
sidebar_label: 'Data fetching'
sidebar_position: 1
---

# Data fetching

The main purpose of this module is to expose an Algebraic Data Type (ADT) to manage the response of HTTP calls.

We don't consider safe design, like the following one:

```ts
const { data, error } = fetch('/api/user')
```

### Deep dive

If you want to deepen the topic, here are some useful resources:

-   [Slaying a ui antipattern](https://medium.com/javascript-inside/slaying-a-ui-antipattern-in-fantasyland-907cbc322d2a)
-   [Milano TS - Algebraic Data Type](https://www.youtube.com/watch?v=rs8rzYmKzVE) _video ita_
