import * as A from 'fp-ts/Array'
import * as O from 'fp-ts/Option'
import * as RE from 'fp-ts/Record'
import { pipe } from 'fp-ts/function'

// -------------------------------------------------------------------------------------
// model
// -------------------------------------------------------------------------------------

type Item = string | number | boolean | Blob | Buffer

export type OptionItem = O.Option<Item | OptionItemArray | OptionItemRecord>
export type OptionItemArray = Array<OptionItem>
export interface OptionItemRecord {
    [key: string]: OptionItem
}

export type NullableItem = undefined | null | Item | NullableItemArray | NullableItemRecord
export type NullableItemArray = Array<NullableItem>
export interface NullableItemRecord {
    [key: string]: NullableItem
}

interface DataRecord {
    [k: string]: string | boolean | Buffer | Blob | DataRecord[] | DataRecord
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

const noNeeRehash = (d: unknown): d is string | boolean | Blob | Buffer =>
    isString(d) || isBoolean(d) || isBlob(d) || isBuffer(d)

const noNeedRecursion = (d: unknown): d is string | boolean | Blob | Buffer | number => noNeeRehash(d) || isNumber(d)

// -------------------------------------------------------------------------------------
// null -> to Option
// -------------------------------------------------------------------------------------

const convertNullableArray = (data: NullableItemArray): OptionItemArray => {
    return pipe(
        data,
        A.map(O.fromNullable),
        A.map(
            O.map(v => {
                if (noNeedRecursion(v)) {
                    return v
                }

                if (Array.isArray(v)) {
                    return convertNullableArray(v)
                }

                return convertNullableObject(v)
            })
        )
    )
}

const convertNullableObject = (data: NullableItemRecord): OptionItemRecord => {
    return pipe(
        data,
        RE.map(O.fromNullable),
        RE.map(
            O.map(v => {
                if (noNeedRecursion(v)) {
                    return v
                }

                if (Array.isArray(v)) {
                    return convertNullableArray(v)
                }

                return convertNullableObject(v)
            })
        )
    )
}

// -------------------------------------------------------------------------------------
// map input to DataRecord
// -------------------------------------------------------------------------------------

const generateKey = (key: string, root?: string): string => (root ? `${root}[${key}]` : key)

const mapArray = (a: OptionItemArray, root: string): DataRecord[] => {
    return pipe(
        a,
        A.filter(O.isSome),
        A.map(d => d.value),
        A.mapWithIndex((i, d) => {
            if (noNeeRehash(d)) {
                return { [`${root}[]`]: d }
            }

            if (isNumber(d)) {
                return { [`${root}[]`]: d.toString() }
            }

            if (Array.isArray(d)) {
                return { [generateKey(i.toString(), root)]: mapArray(d, generateKey(i.toString(), root)) }
            }

            return mapObject(d, generateKey(i.toString(), root))
        })
    )
}

const mapObject = (data: OptionItemRecord, root?: string): DataRecord => {
    return pipe(
        data,
        RE.filter(O.isSome),
        RE.map(d => d.value),
        RE.mapWithIndex((k, d) => {
            if (noNeeRehash(d)) {
                return { [generateKey(k, root)]: d }
            }

            if (isNumber(d)) {
                return { [generateKey(k, root)]: d.toString() }
            }

            if (Array.isArray(d)) {
                return mapArray(d, generateKey(k, root))
            }

            return mapObject(d, generateKey(k, root))
        })
    )
}

// -------------------------------------------------------------------------------------
// append DataRecord to form data
// -------------------------------------------------------------------------------------

const appendToFormData = (data: DataRecord, formData: FormData): FormData => {
    return pipe(
        data,
        RE.reduceWithIndex(formData, (k, fd, d) => {
            if (noNeedRecursion(d)) {
                fd.append(k, d as string)
                return fd
            }

            if (Array.isArray(d)) {
                return pipe(
                    d,
                    A.reduce(fd, (ffd, dr) => appendToFormData(dr, ffd))
                )
            }

            return appendToFormData(d, fd)
        })
    )
}

// -------------------------------------------------------------------------------------
// entry point
// -------------------------------------------------------------------------------------

export const serializeNullableToFormData = (
    data: NullableItemRecord | undefined,
    createFormData?: () => FormData
): FormData => {
    const formData = createFormData ? createFormData() : new FormData()
    return data ? appendToFormData(mapObject(convertNullableObject(data)), formData) : formData
}

export const serializeToFormData = (data: O.Option<OptionItemRecord>, createFormData?: () => FormData): FormData => {
    const formData = createFormData ? createFormData() : new FormData()
    return pipe(
        data,
        O.map(d => appendToFormData(mapObject(d), formData)),
        O.getOrElse(() => formData)
    )
}
