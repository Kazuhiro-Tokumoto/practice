export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(16));
}

export function generateMasterSeed(byte:number): Uint8Array {
  return window.crypto.getRandomValues(new Uint8Array(byte));
}

export function combine(a: Uint8Array, b: Uint8Array): Uint8Array {
    const combined = new Uint8Array(a.length + b.length); // 32+32=64バイト確保
    combined.set(a, 0);
    combined.set(b, a.length);
    return combined;
}