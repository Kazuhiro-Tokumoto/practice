async function sha256(data) {
    const hash = await crypto.subtle.digest("SHA-256", data);
    return new Uint8Array(hash);
}
async function sha512(data) {
    const hash = await crypto.subtle.digest("SHA-512", data);
    return new Uint8Array(hash);
}
function combine(...arrays) {
    let totalLength = 0;
    for (let i = 0; i < arrays.length; i++) {
        totalLength += arrays[i].length;
    }
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (let i = 0; i < arrays.length; i++) {
        result.set(arrays[i], offset);
        offset += arrays[i].length;
    }
    return result;
}
function generateRand(len = 32) {
    return window.crypto.getRandomValues(new Uint8Array(len));
}
export { sha256, sha512, combine, generateRand };
