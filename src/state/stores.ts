export interface Stores {
    _S: '_M'
}

export type SafeStore = keyof Stores extends never ? Record<string, string> : Stores
export type StoreName = keyof SafeStore
export type MutationName<SN extends StoreName> = keyof SafeStore extends never ? string : SafeStore[SN]
export type AllMutationName = keyof SafeStore extends never ? string : SafeStore[StoreName]
