export function generateSalt() {
    return crypto.getRandomValues(new Uint8Array(16));
}
export function generateMasterSeed(byte) {
    return window.crypto.getRandomValues(new Uint8Array(byte));
}
export function combineSalts(saltA, saltB) {
    const combined = new Uint8Array(16);
    for (let i = 0; i < 16; i++) {
        combined[i] = saltA[i] ^ saltB[i];
    }
    return combined;
}
