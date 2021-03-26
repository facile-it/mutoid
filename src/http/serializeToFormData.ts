import * as A from 'fp-ts/Array'
import * as O from 'fp-ts/Option'
import * as RE from 'fp-ts/Record'
import { pipe } from 'fp-ts/function'

// -------------------------------------------------------------------------------------
// model
// -------------------------------------------------------------------------------------

type Item = string | number | boolean | Blob | Buffer
type NullableItem = undefined | null | Item | NullableArray | NullableItemRecord
type NullableArray = Array<NullableItem>
interface NullableItemRecord {
    [key: string]: NullableItem
}
export type NullableItemData = undefined | Record<string, NullableItem>

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

const notNeedWorkInMap = (d: unknown): d is string | boolean | Blob | Buffer =>
    isString(d) || isBoolean(d) || isBlob(d) || isBuffer(d)

const notNeedWorkInAppend = (d: unknown): d is string | boolean | Blob | Buffer | number =>
    notNeedWorkInMap(d) || isNumber(d)

// -------------------------------------------------------------------------------------
// fun
// -------------------------------------------------------------------------------------

const generateKey = (key: string, root?: string): string => (root ? `${root}[${key}]` : key)

const mapArray = (a: Array<NullableItem>, root: string): DataRecord[] => {
    const result = a
        .map(O.fromNullable)
        .filter(O.isSome)
        .map(d => d.value)
        .map((d, i) => {
            if (notNeedWorkInMap(d)) {
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

    return result
}

const mapObject = (data: Record<string, NullableItem>, root?: string): DataRecord => {
    const result = pipe(
        data,
        RE.map(O.fromNullable),
        RE.filter(O.isSome),
        RE.map(d => d.value),
        RE.mapWithIndex((k, d) => {
            if (notNeedWorkInMap(d)) {
                return { [generateKey(k, root)]: d }
            }

            if (isNumber(d)) {
                return { [generateKey(k, root)]: d.toString() }
            }

            if (isBlob(d) || isBuffer(d)) {
                return { [generateKey(k, root)]: d }
            }

            if (Array.isArray(d)) {
                return mapArray(d, generateKey(k, root))
            }

            return mapObject(d, generateKey(k, root))
        })
    )

    return result
}

const appendToFormData = (data: DataRecord, formData: FormData): FormData => {
    return pipe(
        data,
        RE.reduceWithIndex(formData, (k, fd, d) => {
            if (notNeedWorkInAppend(d)) {
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

export const serializeNullableToFormData = (data: NullableItemData, createFormData?: () => FormData): FormData => {
    const formData = createFormData ? createFormData() : new FormData()
    return data ? appendToFormData(mapObject(data), formData) : formData
}
