---
sidebar_label: 'Fetch factory & cache'
sidebar_position: 3
---

# Fetch factory & cache

```ts
import * as RESFF from 'mutoid/http/resourceFetchFactory'
```

## fetchFactory

This function helps to build a `ReaderObservableResource` from an endpoint request, decoders and a list of success codes.

where:

-   _EndpointRequest_ is an extension of `rxJs` `AjaxRequest`
-   _decoders_ is a lazy map, the same that you could use in [fromAjax](./resource#fromajax)
-   _successCodes_ a list of status codes

The principal differences from [fromAjax](./resource#fromajax) are these:

-   The Fail type is always `ResourceBad` i.e. a union of `ResourceBadFail` and `ResourceBadRejected`.

    When the original resource is Fail, it always returns a `ResourceBadFail`. Otherwise, if you want to catch a bad request (e.g. in a form post), you can add a 4\*\* status code to your decoders map and omit it from the `successCodes` list; it will always be returned as `ResourceBadRejected`

-   The Done type is a union of `RES.ResourceData<S, P>`

    ```ts
    interface ResourceData<S, P> {
        readonly status: S
        readonly payload: P
    }
    ```

    Where S can be one of the status codes in the `successCodes` list

    The list of success codes is useful when, for example, an API returns 404 for an empty list or a not existing resource but you don't want to receive a fail resource. In that case the type of Done could be something like this:

    ```ts
    type Done = RES.ResourceData<200, A> | RES.ResourceData<404, B>
    ```

    where `A` and `B` are inferred from the decoders map

## fetchCacheableFactory

This function has the same behavior of the `fetchFactory` function but the _EndpointRequest_ in case of `GET` can accept `appCacheTtl`

In order to manage the cache you have to inject as a dependency a `CachePool` service.
If you want you can develop your service or you can use one of [these adapters](./cache-pool-adapters)
