// crypto/aes.ts
export async function encrypt(key, plaintext) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const data = await crypto.subtle.encrypt({
        name: "AES-GCM",
        iv: iv
    }, key, plaintext);
    return {
        iv,
        data
    };
}
export async function decrypt(key, iv, data) {
    const plain = await crypto.subtle.decrypt({
        name: "AES-GCM",
        iv: iv
    }, key, data);
    return new Uint8Array(plain);
}
