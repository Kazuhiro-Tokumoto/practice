function bigintToBytes(x) {
    let hex = x.toString(16);
    if (hex.length % 2)
        hex = "0" + hex;
    return Uint8Array.from(hex.match(/../g).map(b => parseInt(b, 16)));
}
export { bigintToBytes };
