
export function unorderedEquals<T>(a: T[], b: T[]): boolean {
    function everyEq(aa: T[], bb: T[]): boolean {
        const s = new Set<T>(aa);
        return bb.every(v => s.has(v));
    }
    return everyEq(a, b) && everyEq(b, a);
}
