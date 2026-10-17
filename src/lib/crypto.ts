export interface EncryptedData {
  ciphertext: string;
  iv: string;
  authTag?: string;
  keyVersion?: number;
  algorithm?: string;
}

const MASTER_KEY_HEX =
  process.env.NEXT_PUBLIC_ACCESSDESK_ENCRYPTION_KEY ||
  process.env.ACCESSDESK_ENCRYPTION_KEY ||
  "f172b7801eddd10a974d6becf1503a01dfe1d9e2674344d81611255f19047e02";

function hexToBytes(hex: string): Uint8Array {
  const match = hex.match(/.{1,2}/g) || [];
  return new Uint8Array(match.map((byte) => parseInt(byte, 16)));
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function getCryptoKey(): Promise<CryptoKey> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error("Web Crypto API is not available.");
  }
  const keyBytes = hexToBytes(MASTER_KEY_HEX);
  return subtle.importKey(
    "raw",
    keyBytes as unknown as ArrayBuffer,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptCredential(plaintext: string): Promise<EncryptedData> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) throw new Error("Web Crypto API is not available.");

  const key = await getCryptoKey();
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);

  const encryptedBuf = await subtle.encrypt(
    { name: "AES-GCM", iv: iv as unknown as ArrayBuffer },
    key,
    encoded
  );

  return {
    ciphertext: bytesToHex(new Uint8Array(encryptedBuf)),
    iv: bytesToHex(iv),
    keyVersion: 1,
    algorithm: "aes-256-gcm",
  };
}

export async function decryptCredential(encrypted: EncryptedData): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) throw new Error("Web Crypto API is not available.");

  const key = await getCryptoKey();
  const iv = hexToBytes(encrypted.iv);
  const cipherBytes = hexToBytes(encrypted.ciphertext);

  const decryptedBuf = await subtle.decrypt(
    { name: "AES-GCM", iv: iv as unknown as ArrayBuffer },
    key,
    cipherBytes as unknown as ArrayBuffer
  );

  return new TextDecoder().decode(decryptedBuf);
}
