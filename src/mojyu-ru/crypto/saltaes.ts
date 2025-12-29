export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(16));
}

export function generateMasterSeed(byte:number): Uint8Array {
  return window.crypto.getRandomValues(new Uint8Array(byte));
}

export function combineSalts(saltA: Uint8Array, saltB: Uint8Array): Uint8Array {
    const combined = new Uint8Array(16);
    for (let i = 0; i < 16; i++) {
        combined[i] = saltA[i] ^ saltB[i];
    }
    return combined;
}