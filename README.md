# Mutoid

Reactive library for data fetching, caching, state management (also) for isomorphic applications

## Installation

```sh
npm install mutoid
```

If you want to use [`io-ts`](https://github.com/gcanti/io-ts) decoder in data fetching or cache

```sh
npm install io-ts
```

If you want also to use it with [`react`](https://github.com/facebook/react)

```sh
npm install react
```

**Note** [`rxjs`](https://github.com/ReactiveX/rxjs), [`fp-ts`](https://github.com/gcanti/fp-ts),[`fp-ts-rxjs`](https://github.com/gcanti/fp-ts-rxjs) are required peer dependencies.
Instead [`react`](https://github.com/facebook/react) and [`io-ts`](https://github.com/gcanti/io-ts) are an optional peer dependencies.

## Documentation

[https://engineering.facile.it/mutoid](https://engineering.facile.it/mutoid)

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
