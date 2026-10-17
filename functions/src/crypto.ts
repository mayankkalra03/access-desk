import * as crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96 bits for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits

export interface EncryptedCredential {
  ciphertext: string;
  iv: string;
  authTag: string;
  algorithm: string;
  keyVersion: number;
}

/**
 * Encrypts a plaintext password using AES-256-GCM authenticated encryption.
 * The encryption key is sourced securely from server-side environment / Secret Manager.
 */
export function encryptPassword(
  plaintext: string,
  masterKeyHex: string,
  keyVersion = 1
): EncryptedCredential {
  if (!masterKeyHex || masterKeyHex.length !== 64) {
    throw new Error(
      "Invalid encryption key. A 64-character hex string (256-bit key) is required."
    );
  }
  const key = Buffer.from(masterKeyHex, "hex");
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  let ciphertext = cipher.update(plaintext, "utf8", "hex");
  ciphertext += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  return {
    ciphertext,
    iv: iv.toString("hex"),
    authTag,
    algorithm: ALGORITHM,
    keyVersion,
  };
}

/**
 * Decrypts an AES-256-GCM ciphertext using the master key and verifies the GCM authentication tag.
 * Throws an error if the tag is invalid or data was tampered with.
 */
export function decryptPassword(
  encrypted: EncryptedCredential,
  masterKeyHex: string
): string {
  if (!masterKeyHex || masterKeyHex.length !== 64) {
    throw new Error(
      "Invalid encryption key. A 64-character hex string (256-bit key) is required."
    );
  }
  const key = Buffer.from(masterKeyHex, "hex");
  const iv = Buffer.from(encrypted.iv, "hex");
  const authTag = Buffer.from(encrypted.authTag, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted.ciphertext, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
