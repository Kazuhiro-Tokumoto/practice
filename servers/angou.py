# aes256_gcm_tool.py
import os
import base64
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

# ===== 設定 =====
ITERATIONS = 800000     # PBKDF2の反復回数（多いほど総当たりに強い）
KEY_LEN = 32             # 32バイト = 256bit → AES-256
SALT_LEN = 16            # ソルト長
NONCE_LEN = 12           # GCM推奨サイズ（12バイト）


def derive_key(password: str, salt: bytes) -> bytes:
    """パスワード + ソルト から AES-256 用の鍵を生成"""
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=KEY_LEN,
        salt=salt,
        iterations=ITERATIONS,
    )
    return kdf.derive(password.encode("utf-8"))


def encrypt(message: str, password: str) -> str:
    """文字列を AES-256-GCM で暗号化し、base64文字列で返す"""
    # ランダムソルト＆ノンス生成
    salt = os.urandom(SALT_LEN)
    key = derive_key(password, salt)     # ここで 256bit 鍵ができる
    aesgcm = AESGCM(key)
    nonce = os.urandom(NONCE_LEN)

    # UTF-8エンコードして暗号化
    ciphertext = aesgcm.encrypt(nonce, message.encode("utf-8"), None)

    # 保存形式: salt | nonce | ciphertext を base64 化
    data = salt + nonce + ciphertext
    return base64.b64encode(data).decode("ascii")


def decrypt(token_b64: str, password: str) -> str:
    """AES-256-GCM の暗号文(base64)を復号して文字列を返す"""
    data = base64.b64decode(token_b64.encode("ascii"))

    # salt | nonce | ciphertext に分解
    salt = data[:SALT_LEN]
    nonce = data[SALT_LEN:SALT_LEN + NONCE_LEN]
    ciphertext = data[SALT_LEN + NONCE_LEN:]

    key = derive_key(password, salt)
    aesgcm = AESGCM(key)

    plaintext = aesgcm.decrypt(nonce, ciphertext, None)
    return plaintext.decode("utf-8")


# ===== メインループ =====
if __name__ == "__main__":
    while True:
        print("\n=== AES-256-GCM TOOL ===")
        print("1: 暗号化")
        print("2: 復号化")
        print("3: 終了")
        mode = input("選択 → ").strip()

        if mode == "1":
            text = input("暗号化する文字列: ")
            pw = input("パスワード: ")
            encrypted = encrypt(text, pw)
            print("\n暗号文 (base64):")
            print(encrypted)

        elif mode == "2":
            token = input("暗号文 (base64): ")
            pw = input("パスワード: ")
            try:
                decrypted = decrypt(token, pw)
                print("\n復号結果:")
                print(decrypted)
            except Exception:
                print("\n復号エラー（パスワード違い or データ破損 or 改ざん検出）")

        elif mode == "3":
            print("終了します。")
            break

        else:
            print("1〜3 を選んでください。")

