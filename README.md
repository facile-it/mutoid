# Mutoid

Reactive library for state management, data fetching, caching with some utilities to use with _React_

## Installation

To install the last version

```sh
yarn add mutoid rxjs fp-ts fp-ts-rxjs

// or

npm install mutoid // if you use npm >= 7 otherwise you need to install peer dependencies manually
```

If you want also to use it with [`react`](https://github.com/facebook/react)

```sh
yarn add react

// or

npm install react
```

**Note** [`rxjs`](https://github.com/ReactiveX/rxjs), [`fp-ts`](https://github.com/gcanti/fp-ts),[`fp-ts-rxjs`](https://github.com/gcanti/fp-ts-rxjs) are required peer dependencies.
Instead [`react`](https://github.com/facebook/react) is an optional peer dependency.

If you want to use [`io-ts`](https://github.com/gcanti/io-ts) decoder in data fetching

```sh
yarn add io-ts

// or

npm install io-ts
```

## Modules

| Module           |                                                                                         |
| ---------------- | --------------------------------------------------------------------------------------- |
| State management | [README](https://github.com/facile-it/mutoid/tree/master/src/state/README.md)           |
| Data fetching    | [README](https://github.com/facile-it/mutoid/tree/master/src/http/README.md)            |
| React bindings   | [README](https://github.com/facile-it/mutoid/tree/master/src/react/README.md)           |
| RxJs             | Deprecated [README](https://github.com/facile-it/mutoid/tree/master/src/rxjs/README.md) |

## Example

If you want to see a simple [app](https://github.com/facile-it/mutoid/tree/master/example)  
If you clone this repo, you can run the example with

```console
npm install
npm run dev-server
```

## Test

### Unit, lint and cs

```console
npm run test
```

### Type level

```console
npm run test-type
```
