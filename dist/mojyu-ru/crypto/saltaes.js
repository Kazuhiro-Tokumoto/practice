export function generateSalt() {
    return crypto.getRandomValues(new Uint8Array(16));
}
export function generateMasterSeed(byte) {
    return window.crypto.getRandomValues(new Uint8Array(byte));
}
export function combine(a, b) {
    const combined = new Uint8Array(a.length + b.length); // 32+32=64バイト確保
    combined.set(a, 0);
    combined.set(b, a.length);
    return combined;
}
