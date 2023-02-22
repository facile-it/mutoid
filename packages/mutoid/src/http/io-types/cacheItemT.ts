import * as t from 'io-ts'
import { statusCodeT } from './statusCodeT'

export type CacheItemC<P extends t.Mixed = t.UnknownC> = t.TypeC<{
    status: typeof statusCodeT
    payload: t.Type<t.TypeOf<P>, t.OutputOf<P>, unknown>
}>

export function cacheItemWithPayloadT<P extends t.Mixed>(
    payloadCodec: P,
    name = `CacheItem<${payloadCodec.name}>`
): CacheItemC<P> {
    return t.interface(
        {
            status: statusCodeT,
            payload: payloadCodec,
        },
        name
    )
}

export const cacheItemT = t.interface(
    {
        status: statusCodeT,
        payload: t.unknown,
    },
    'CacheItem<unknown>'
)
