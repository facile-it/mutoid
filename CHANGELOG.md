# Changelog

## 0.3.0 (2020-11-10)

-   added `ResourceAjaxFail` type
-   added `resourceAjaxFail` constructor, use it instead of `resourceFail` for building `AjaxSubject`
-   changed `AjaxSubject` into `Observable<AjaxResponse | ResourceAjaxFail<AE>>` [BREAKING CHANGE]  
    `ResourceAjaxFail` is a subtype of `ResourceFail`
-   renamed `resourceFold` as `resourceFold_` [BREAKING CHANGE]
-   changed `resourceFold` (pipeable version)
-   removed `io-ts` strict dependency, now you can use your custom function as decoder  
    `type ResourceDecoders = { [k in StatusCode]?: (i: unknown) => E.Either<unknown, unknown> }`
-   added some `Resource` guards
-   fixed `useResourceFetcher` inference
