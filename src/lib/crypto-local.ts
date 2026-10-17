/**
 * Local Cryptographic Helper using Web Crypto API (AES-GCM 256-bit)
 * Ensures that even in local/emulator mode, credentials are NEVER stored as plaintext.
 */

const LOCAL_KEY_STORAGE = "accessdesk_local_master_entropy";

async function getOrCreateLocalCryptoKey(): Promise<CryptoKey> {
  if (typeof window === "undefined" || !window.crypto || !window.crypto.subtle) {
    throw new Error("Web Crypto API is not available.");
  }

  let storedRaw = window.localStorage.getItem(LOCAL_KEY_STORAGE);
  let rawBytes: Uint8Array;

  if (!storedRaw) {
    rawBytes = window.crypto.getRandomValues(new Uint8Array(32));
    storedRaw = Array.from(rawBytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    window.localStorage.setItem(LOCAL_KEY_STORAGE, storedRaw);
  } else {
    const match = storedRaw.match(/.{1,2}/g);
    rawBytes = new Uint8Array(match ? match.map((byte) => parseInt(byte, 16)) : []);
  }

  return window.crypto.subtle.importKey(
    "raw",
    rawBytes as unknown as ArrayBuffer,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptLocalPassword(plaintext: string): Promise<{
  ciphertext: string;
  iv: string;
}> {
  const key = await getOrCreateLocalCryptoKey();
  const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96 bits for GCM
  const encoded = new TextEncoder().encode(plaintext);

  const encryptedBuf = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as unknown as ArrayBuffer },
    key,
    encoded
  );

  const ciphertextHex = Array.from(new Uint8Array(encryptedBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const ivHex = Array.from(iv)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return {
    ciphertext: ciphertextHex,
    iv: ivHex,
  };
}

export async function decryptLocalPassword(
  ciphertextHex: string,
  ivHex: string
): Promise<string> {
  const key = await getOrCreateLocalCryptoKey();
  const ivBytes = new Uint8Array(
    (ivHex.match(/.{1,2}/g) || []).map((b) => parseInt(b, 16))
  );
  const cipherBytes = new Uint8Array(
    (ciphertextHex.match(/.{1,2}/g) || []).map((b) => parseInt(b, 16))
  );

  const decryptedBuf = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: ivBytes as unknown as ArrayBuffer },
    key,
    cipherBytes as unknown as ArrayBuffer
  );

  return new TextDecoder().decode(decryptedBuf);
}
