// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Stores {}

export type storeName = keyof Stores
export type mutationName<SN extends storeName> = Stores[SN]
export type allMutationName = Stores[storeName]
