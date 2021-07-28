const handler: ProxyHandler<MockWebStorage> = {
    get(target: any, prop: string) {
        return ['getItem', 'removeItem', 'clear', 'setItem', 'key', 'length'].includes(prop)
            ? target[prop]
            : target.getItem(prop)
    },
    ownKeys(target) {
        return Object.keys(target.store)
    },
    getOwnPropertyDescriptor() {
        return {
            enumerable: true,
            configurable: true,
        }
    },
}

export class MockWebStorage {
    constructor() {
        return new Proxy(this, handler)
    }

    public store: Record<string, string> = {}

    getItem = (key: string) => {
        return this.store[key] ?? null
    }

    removeItem = (key: string) => {
        delete this.store[key]
    }

    clear = () => {
        this.store = {}
    }

    setItem = (key: string, value: string) => {
        this.store[key] = value
    }

    key = (i: number) => {
        return Object.keys(this.store)[i] ?? null
    }

    get length() {
        return Object.keys(this.store).length
    }
}
