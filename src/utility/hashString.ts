export const hashString = (s: string): string => {
    let h = 0xdeadbeef
    for (let i = 0; i < s.length; i++) {
        // eslint-disable-next-line no-bitwise
        h = Math.imul(h ^ s.charCodeAt(i), 2654435761)
    }
    // eslint-disable-next-line no-bitwise
    return ((h ^ (h >>> 16)) >>> 0).toString()
}
