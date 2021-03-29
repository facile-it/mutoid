import * as A from 'fp-ts/Array'
import * as O from 'fp-ts/Option'
import * as RE from 'fp-ts/Record'
import { flow, pipe } from 'fp-ts/function'

// -------------------------------------------------------------------------------------
// model
// -------------------------------------------------------------------------------------

type UrlItem = string | number | boolean
type FormItem = string | number | boolean | Blob | Buffer

export type Item<A> = A | ItemArray<A> | ItemRecord<A>
export type ItemArray<A> = Array<A | OptionItem<A>>
export interface ItemRecord<A> {
    [key: string]: Item<A> | OptionItem<A>
}
export type OptionItem<A> = O.Option<A | OptionItemArray<A> | OptionItemRecord<A> | A> | Item<A>
export type OptionItemArray<A> = Array<OptionItem<A> | Item<A>>
export interface OptionItemRecord<A> {
    [key: string]: OptionItem<A> | Item<A>
}

export type NullableItem<A> = undefined | null | A | NullableItemArray<A> | NullableItemRecord<A>
export type NullableItemArray<A> = Array<NullableItem<A>>
export interface NullableItemRecord<A> {
    [key: string]: NullableItem<A>
}

interface DataRecord<O> {
    [k: string]: O | DataRecord<O>[] | DataRecord<O>
}

// -------------------------------------------------------------------------------------
// guards
// -------------------------------------------------------------------------------------

const isBrowser = () => typeof window !== 'undefined' && typeof window.document !== 'undefined'
const isNode = () => typeof process !== 'undefined' && process.versions !== null && process.versions.node !== null

const isBlob = (d: unknown): d is Blob => isBrowser() && d instanceof Blob
const isBuffer = (d: unknown): d is Buffer => isNode() && d instanceof Buffer
const isBoolean = (d: unknown): d is boolean => typeof d === 'boolean'
const isString = (d: unknown): d is string => typeof d === 'string'
const isNumber = (d: unknown): d is number => typeof d === 'number'

const noNeeRehashUrl = (d: unknown): d is UrlItem => isString(d) || isBoolean(d) || isNumber(d)

const noNeeRehashForm = (d: unknown): d is FormItem =>
    isString(d) || isBoolean(d) || isNumber(d) || isBlob(d) || isBuffer(d)

const hasTag = (a: unknown): a is { _tag: unknown } =>
    typeof a === 'object' && Object.prototype.hasOwnProperty.call(a, '_tag')

const isOption = <A>(oi: OptionItem<A> | Item<A>): oi is O.Option<Item<A>> => {
    return hasTag(oi) && (oi._tag === 'None' || oi._tag === 'Some')
}

// -------------------------------------------------------------------------------------
// null -> to Option
// -------------------------------------------------------------------------------------

const convertNullableArray = <A>(noNeedRecursion: (a: NullableItemRecord<A> | NullableItemArray<A> | A) => a is A) => (
    data: NullableItemArray<A>
): OptionItemArray<A> => {
    return pipe(
        data,
        A.map(O.fromNullable),
        A.map(
            O.map(d => {
                if (noNeedRecursion(d)) {
                    return d
                }

                if (Array.isArray(d)) {
                    return convertNullableArray(noNeedRecursion)(d)
                }

                return convertNullableObject(noNeedRecursion)(d)
            })
        )
    )
}

const convertNullableObject = <A>(noNeedRecursion: (a: NullableItemRecord<A> | NullableItemArray<A> | A) => a is A) => (
    data: NullableItemRecord<A>
): OptionItemRecord<A> => {
    return pipe(
        data,
        RE.map(O.fromNullable),
        RE.map(
            O.map(d => {
                if (noNeedRecursion(d)) {
                    return d
                }

                if (Array.isArray(d)) {
                    return convertNullableArray(noNeedRecursion)(d)
                }

                return convertNullableObject(noNeedRecursion)(d)
            })
        )
    )
}

// -------------------------------------------------------------------------------------
// map input to DataRecord
// -------------------------------------------------------------------------------------

const generateKey = (key: string, root?: string): string => (root ? `${root}[${key}]` : key)

const mapArray = <A>(noNeedRecursion: (a: A | OptionItemArray<A> | OptionItemRecord<A>) => a is A) => (
    data: OptionItemArray<A>,
    root: string
): DataRecord<A>[] => {
    return pipe(
        data,
        A.map(oi => (isOption(oi) ? oi : O.some(oi))),
        A.filter(O.isSome),
        A.map(d => d.value),
        A.mapWithIndex((i, d) => {
            if (noNeedRecursion(d)) {
                return { [`${root}[]`]: d }
            }

            if (Array.isArray(d)) {
                return {
                    [generateKey(i.toString(), root)]: mapArray(noNeedRecursion)(d, generateKey(i.toString(), root)),
                }
            }

            return mapObject(noNeedRecursion)(d, generateKey(i.toString(), root))
        })
    )
}

const mapObject = <A>(noNeedRecursion: (a: A | OptionItemArray<A> | OptionItemRecord<A>) => a is A) => (
    data: OptionItemRecord<A>,
    root?: string
): DataRecord<A> => {
    return pipe(
        data,
        RE.map(oi => (isOption(oi) ? oi : O.some(oi))),
        RE.filter(O.isSome),
        RE.map(d => d.value),
        RE.mapWithIndex((k, d) => {
            if (noNeedRecursion(d)) {
                return { [generateKey(k, root)]: d }
            }

            if (Array.isArray(d)) {
                return mapArray(noNeedRecursion)(d, generateKey(k, root))
            }

            return mapObject(noNeedRecursion)(d, generateKey(k, root))
        })
    )
}

// -------------------------------------------------------------------------------------
// append DataRecord to collector
// -------------------------------------------------------------------------------------

const appendToFormData = <A>(noNeedRecursion: (a: A | OptionItemArray<A> | OptionItemRecord<A>) => a is A) => <
    C extends { append: (k: string, value: A) => void }
>(
    collector: C
) => (data: DataRecord<A>): C => {
    return pipe(
        data,
        RE.reduceWithIndex(collector, (k, fd, d) => {
            if (noNeedRecursion(d)) {
                fd.append(k, d)
                return fd
            }

            if (Array.isArray(d)) {
                return pipe(
                    d,
                    A.reduce(fd, (ffd, dr) => appendToFormData(noNeedRecursion)(ffd)(dr))
                )
            }

            return appendToFormData(noNeedRecursion)(fd)(d)
        })
    )
}

export const serializeNullable = <C extends { append: (k: string, value: any) => void }, A>(
    collector: C,
    noNeedRecursion: (a: unknown) => a is A,
    data: NullableItemRecord<A> | undefined
): C => {
    return pipe(
        data,
        O.fromNullable,
        O.map(
            flow(
                convertNullableObject(noNeedRecursion),
                mapObject(noNeedRecursion),
                appendToFormData(noNeedRecursion)(collector)
            )
        ),
        O.getOrElse(() => collector)
    )
}

export const serialize = <C extends { append: (k: string, value: any) => void }, A>(
    collector: C,
    noNeedRecursion: (a: unknown) => a is A,
    data: OptionItemRecord<A>
): C => {
    return pipe(data, mapObject(noNeedRecursion), appendToFormData(noNeedRecursion)(collector))
}

// -------------------------------------------------------------------------------------
// entry point
// -------------------------------------------------------------------------------------

export const serializeNullableForm = <C extends { append: (k: string, value: any) => void }>(collector: C) => (
    data: NullableItemRecord<FormItem> | undefined
): C => {
    return serializeNullable(collector, noNeeRehashForm, data)
}

export const serializeForm = <C extends { append: (k: string, value: any) => void }>(collector: C) => (
    data: OptionItemRecord<FormItem>
): C => {
    return serialize(collector, noNeeRehashForm, data)
}

export const serializeNullableUrl = <C extends { append: (k: string, value: any) => void }>(collector: C) => (
    data: NullableItemRecord<UrlItem> | undefined
): C => {
    return serializeNullable(collector, noNeeRehashUrl, data)
}

export const serializeUrl = <C extends { append: (k: string, value: any) => void }>(collector: C) => (
    data: OptionItemRecord<UrlItem>
): C => {
    return serialize(collector, noNeeRehashUrl, data)
}

export const toQueryString = <C extends { toString: () => string }>(c: C): string => {
    return pipe(c.toString(), s => (s.length > 0 ? `?${s}` : ''))
}
