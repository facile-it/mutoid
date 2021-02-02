# Mutoid

Reactive library for state management, data fetching, caching (wip) with some utilities to use with _React_

---

### Installation

To install the last version

```sh
yarn add mutoid rxjs fp-ts
```

if you want to use [`io-ts`](https://github.com/gcanti/io-ts) decoder in data fetching

```sh
yarn add io-ts
```

if you want also to use with [`react`](https://github.com/facebook/react)

```sh
yarn add react-dom react
```

**Note** [`rxjs`](https://github.com/ReactiveX/rxjs), [`fp-ts`](https://github.com/gcanti/fp-ts), [`io-ts`](https://github.com/gcanti/io-ts), [`react`](https://github.com/facebook/react) are a peer dependency for `mutoid`

---

### Modules

| Module           |                                                                                                |
| ---------------- | ---------------------------------------------------------------------------------------------- |
| State management | [README](https://github.com/facile-it/mutoid/tree/master/src/state)                            |
| Data fetching    | [README](https://github.com/facile-it/mutoid/tree/master/src/http)                             |
| React bindings   | [README](https://github.com/facile-it/mutoid/tree/master/src/react)                            |
| RxJs             | Deprecated [README](https://github.com/facile-it/mutoid/tree/master/src/rxjs) |

---

### Run example

```console
yarn dev-server
```

---

### Test

##### Unit, lint and cs

```console
yarn test
```

##### Type level

```console
yarn test-type
```
