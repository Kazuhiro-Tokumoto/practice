/**
 * ArrayBuffer を Base64 文字列に変換する（最速版）
 */
export async function arrayBufferToBase64(buf: ArrayBuffer | Uint8Array): Promise<string> {
    const uint8 = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
    const blob = new Blob([new Uint8Array(uint8)]);
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(",")[1]);
        };
        reader.readAsDataURL(blob);
    });
}


/**
 * Base64 文字列を Uint8Array に変換する
 */
export async function base64ToUint8Array(b64: string): Promise<Uint8Array> {
    const res = await fetch(`data:application/octet-stream;base64,${b64}`);
    return new Uint8Array(await res.arrayBuffer());
}



export function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}