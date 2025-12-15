// crypto/aes.ts
export async function encrypt(
    key: CryptoKey,
    plaintext: BufferSource
): Promise < {
    iv: Uint8Array;data: ArrayBuffer
} > {
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const data = await crypto.subtle.encrypt({
            name: "AES-GCM",
            iv: iv as BufferSource
        },
        key,
        plaintext
    );

    return {
        iv,
        data
    };
}

export async function decrypt(
    key: CryptoKey,
    iv: Uint8Array,
    data: ArrayBuffer
): Promise < Uint8Array > {
    const plain = await crypto.subtle.decrypt({
            name: "AES-GCM",
            iv: iv as BufferSource
        },
        key,
        data
    );

    return new Uint8Array(plain);
}