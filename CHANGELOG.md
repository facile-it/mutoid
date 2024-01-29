# Changelog

## 0.6.0-rc

-   Upgraded peerDependencies: `rxjs@^7.8`, `react@^17.0.2 || ^18.2.0`

-   Replace `fp-ts-rxjs` peerDependency with `fp-ts-reactive`

-   New peerDependency `use-sync-external-store`

## 0.5.0

-   Added in http module `resourceFetchFactory`, `io-types`, `cachePoolAdapters`

-   Upgraded `peerDependencies` requirement `fp-ts@2.10.5`

## 0.4.2 (2021-06-08)

-   Remove key engines from builded package json

## 0.4.1 (2021-05-07)

-   fix `useSelector` inference
-   improve store type

## 0.4.0 (2021-05-01)

-   deprecated module `rxjs` use `fp-ts-rxjs`
-   split http module in `ReaderObservableResource`, `ObservableResource` and `Resource` [BREAKING CHANGE] (see [upgrade-to-0.4 guide](https://engineering.facile.it/mutoid/docs/migration/upgrade-to-0.4))
-   added `dataSerializer` in http module
-   added `mutoid/state/stores` and removed memoization in ctor [BREAKING CHANGE] (see [upgrade-to-0.4 guide](https://engineering.facile.it/mutoid/docs/migration/upgrade-to-0.4))
-   removed fast-memoize dependency
-   added hooks in react module: `useStore`, `useFetchReaderObservableResource`, `useFetchObservableResource`
-   deprecated `useResourceFetcher` hook in react module

## 0.3.1 (2020-11-25)

-   fix `useResourceFetcher` init value inference

## 0.3.0 (2020-11-10)

-   added `ResourceAjaxFail` type
-   added `resourceAjaxFail` constructor, use it instead of `resourceFail` for building `AjaxSubject`
-   changed `AjaxSubject` into `Observable<AjaxResponse | ResourceAjaxFail<AE>>` [BREAKING CHANGE]  
    `ResourceAjaxFail` is a subtype of `ResourceFail`
-   renamed `resourceFold` as `resourceFold_`, and fixed `onfail` -> `onFail` [BREAKING CHANGE]
-   changed `resourceFold` (pipeable version)
-   removed `io-ts` strict dependency, now you can use your custom function as decoder  
    `type ResourceDecoders = { [k in StatusCode]?: (i: unknown) => E.Either<unknown, unknown> }`
-   added some `Resource` guards
-   fixed `useResourceFetcher` inference
