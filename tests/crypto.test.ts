import { describe, it, expect } from "vitest";
import { encryptPassword, decryptPassword } from "../functions/src/crypto";
import * as crypto from "crypto";

describe("AES-256-GCM Credential Encryption & Decryption", () => {
  const masterKey = crypto.randomBytes(32).toString("hex"); // 256-bit key

  it("successfully encrypts and decrypts a password", () => {
    const originalPassword = "SuperSecretHealthcarePassword2026!#$";
    const encrypted = encryptPassword(originalPassword, masterKey);

    expect(encrypted.ciphertext).toBeDefined();
    expect(encrypted.ciphertext).not.toBe(originalPassword);
    expect(encrypted.iv).toHaveLength(24); // 12 bytes = 24 hex characters
    expect(encrypted.authTag).toHaveLength(32); // 16 bytes = 32 hex characters
    expect(encrypted.algorithm).toBe("aes-256-gcm");

    const decrypted = decryptPassword(encrypted, masterKey);
    expect(decrypted).toBe(originalPassword);
  });

  it("produces unique IV and unique ciphertext for the same password", () => {
    const password = "SamePasswordTwice";
    const enc1 = encryptPassword(password, masterKey);
    const enc2 = encryptPassword(password, masterKey);

    expect(enc1.iv).not.toBe(enc2.iv);
    expect(enc1.ciphertext).not.toBe(enc2.ciphertext);

    expect(decryptPassword(enc1, masterKey)).toBe(password);
    expect(decryptPassword(enc2, masterKey)).toBe(password);
  });

  it("fails to decrypt if the ciphertext is tampered with", () => {
    const original = "TamperResistanceTest";
    const encrypted = encryptPassword(original, masterKey);

    // Tamper with ciphertext by altering last characters
    const tamperedCiphertext =
      encrypted.ciphertext.slice(0, -2) + (encrypted.ciphertext.endsWith("00") ? "11" : "00");

    expect(() => {
      decryptPassword(
        {
          ...encrypted,
          ciphertext: tamperedCiphertext,
        },
        masterKey
      );
    }).toThrow();
  });

  it("fails to decrypt if wrong master key is used", () => {
    const password = "KeyIntegrityTest";
    const encrypted = encryptPassword(password, masterKey);
    const wrongKey = crypto.randomBytes(32).toString("hex");

    expect(() => {
      decryptPassword(encrypted, wrongKey);
    }).toThrow();
  });

  it("rejects invalid key lengths", () => {
    expect(() => {
      encryptPassword("test", "shortKey");
    }).toThrow(/64-character hex string/);
  });
});
