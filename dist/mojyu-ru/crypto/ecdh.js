export async function generateKeyPair() {
    return crypto.subtle.generateKey({
        name: "ECDH",
        namedCurve: "P-256"
    }, false, ["deriveBits"]);
}
export async function deriveSharedSecret(privateKey, publicKey) {
    return crypto.subtle.deriveBits({
        name: "ECDH",
        public: publicKey
    }, privateKey, 256);
}
