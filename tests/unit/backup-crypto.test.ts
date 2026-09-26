import { describe, it, expect } from "vitest";
import { encryptPayload, decryptPayload } from "../../scripts/backup-restore";

describe("Sanctuary Backup Encryption (AES-256-GCM)", () => {
  it("encrypts and decrypts database payload with integrity verification", () => {
    const originalData = JSON.stringify({
      users: [{ id: "u-1", role: "admin" }],
      memories: [{ id: "m-1", title: "Midnight Walk", body: "Private letters" }],
    });

    const envelope = encryptPayload(originalData);
    expect(envelope.iv).toHaveLength(32); // 16 bytes = 32 hex chars
    expect(envelope.authTag).toHaveLength(32); // 16 bytes = 32 hex chars
    expect(envelope.ciphertext).not.toContain("Midnight Walk");

    const decrypted = decryptPayload(envelope.ciphertext, envelope.iv, envelope.authTag);
    expect(decrypted).toBe(originalData);
    expect(JSON.parse(decrypted).memories[0].title).toBe("Midnight Walk");
  });

  it("fails decryption when ciphertext is tampered with", () => {
    const original = "Sensitive sanctuary relationship chronicles";
    const envelope = encryptPayload(original);

    // Tamper with first byte of ciphertext
    const tamperedHex = (envelope.ciphertext[0] === "a" ? "b" : "a") + envelope.ciphertext.slice(1);

    expect(() => {
      decryptPayload(tamperedHex, envelope.iv, envelope.authTag);
    }).toThrow();
  });

  it("fails decryption when authentication tag is tampered with", () => {
    const original = "Sensitive sanctuary relationship chronicles";
    const envelope = encryptPayload(original);

    // Tamper with authTag
    const tamperedTag = (envelope.authTag[0] === "0" ? "1" : "0") + envelope.authTag.slice(1);

    expect(() => {
      decryptPayload(envelope.ciphertext, envelope.iv, tamperedTag);
    }).toThrow();
  });
});
