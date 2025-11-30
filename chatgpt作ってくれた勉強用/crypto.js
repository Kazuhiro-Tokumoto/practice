// ==== crypto.js ====
// AES-GCM + PBKDF2 暗号ライブラリ（tuusinn.pyと完全互換）

const SALT_LEN = 16;
const NONCE_LEN = 12;
const ITERATIONS = 800000;

const te = new TextEncoder();
const td = new TextDecoder();

// base64 encode
function b64enc(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

// base64 decode
function b64dec(str) {
  return Uint8Array.from(atob(str), (c) => c.charCodeAt(0));
}

// キー導出
async function deriveKey(password, salt) {
  const baseKey = await crypto.subtle.importKey(
    "raw",
    te.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt,
      iterations: ITERATIONS,
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

// 暗号化
async function EncryptAES(message, password) {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LEN));
  const nonce = crypto.getRandomValues(new Uint8Array(NONCE_LEN));
  const key = await deriveKey(password, salt);

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: nonce },
    key,
    te.encode(message)
  );

  const out = new Uint8Array(SALT_LEN + NONCE_LEN + encrypted.byteLength);
  out.set(salt, 0);
  out.set(nonce, SALT_LEN);
  out.set(new Uint8Array(encrypted), SALT_LEN + NONCE_LEN);

  return b64enc(out);
}

// 復号
async function DecryptAES(base64, password) {
  const data = b64dec(base64);

  const salt = data.slice(0, SALT_LEN);
  const nonce = data.slice(SALT_LEN, SALT_LEN + NONCE_LEN);
  const ciphertext = data.slice(SALT_LEN + NONCE_LEN);

  const key = await deriveKey(password, salt);

  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: nonce },
    key,
    ciphertext
  );

  return td.decode(plain);
}

window.EncryptAES = EncryptAES;
window.DecryptAES = DecryptAES;
