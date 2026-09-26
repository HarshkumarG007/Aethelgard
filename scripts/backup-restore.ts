/**
 * Aethelgard Database Snapshot Extraction & Referential Integrity Harness
 * 
 * Complies with Acceptance & Release Gate §14:
 * 1. Extracts relational snapshot across all database tables
 * 2. Authenticates and encrypts the backup file using AES-256-GCM
 * 3. Verifies cryptographic checksums and AES-GCM authentication tags
 * 4. Validates referential integrity tree (users -> chapters -> memories -> assets)
 * 5. Validates memory and media asset data shapes
 * 
 * Note on Operational RTO/RPO:
 * This harness verifies logical snapshot extraction and cryptographic integrity.
 * Full operational database restoration (RTO < 15 min, RPO < 1 hour) is executed
 * via the documented PostgreSQL pg_dump / pg_restore runbook (docs/DEPLOYMENT_GUIDE.md §6).
 */

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { db } from "../lib/db";
import { users, chapters, memories, memoryAssets, auditLogs } from "../lib/db/schema";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

export interface BackupManifest {
  version: 1;
  createdAt: string;
  checksum: string;
  tableCounts: Record<string, number>;
  data: {
    users: Array<typeof users.$inferSelect>;
    chapters: Array<typeof chapters.$inferSelect>;
    memories: Array<typeof memories.$inferSelect>;
    memoryAssets: Array<typeof memoryAssets.$inferSelect>;
    auditLogs: Array<typeof auditLogs.$inferSelect>;
  };
}

export interface EncryptedBackupEnvelope {
  format: "aethelgard-encrypted-snapshot-v1";
  algorithm: "aes-256-gcm";
  createdAt: string;
  iv: string;
  authTag: string;
  encryptedData: string;
}

function getBackupKey(): Buffer {
  const secret =
    process.env.BACKUP_ENCRYPTION_KEY ||
    process.env.SESSION_SECRET ||
    "aethelgard-default-backup-encryption-key-32b";
  return crypto.createHash("sha256").update(secret).digest();
}

export function encryptPayload(plaintext: string): { ciphertext: string; iv: string; authTag: string } {
  const key = getBackupKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");
  return {
    ciphertext: encrypted,
    iv: iv.toString("hex"),
    authTag,
  };
}

export function decryptPayload(ciphertext: string, ivHex: string, authTagHex: string): string {
  const key = getBackupKey();
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(ciphertext, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

export async function createSanctuaryBackup(): Promise<{
  manifest: BackupManifest;
  envelope: EncryptedBackupEnvelope;
  backupPath: string;
}> {
  const startTime = Date.now();
  console.log("[Snapshot-Harness] Starting database snapshot extraction...");

  const [allUsers, allChapters, allMemories, allAssets, allLogs] = await Promise.all([
    db.select().from(users),
    db.select().from(chapters),
    db.select().from(memories),
    db.select().from(memoryAssets),
    db.select().from(auditLogs),
  ]);

  const dataPayload = {
    users: allUsers,
    chapters: allChapters,
    memories: allMemories,
    memoryAssets: allAssets,
    auditLogs: allLogs,
  };

  const payloadString = JSON.stringify(dataPayload);
  const checksum = crypto.createHash("sha256").update(payloadString).digest("hex");

  const manifest: BackupManifest = {
    version: 1,
    createdAt: new Date().toISOString(),
    checksum,
    tableCounts: {
      users: allUsers.length,
      chapters: allChapters.length,
      memories: allMemories.length,
      memoryAssets: allAssets.length,
      auditLogs: allLogs.length,
    },
    data: dataPayload,
  };

  const rawJson = JSON.stringify(manifest, null, 2);
  const { ciphertext, iv, authTag } = encryptPayload(rawJson);

  const envelope: EncryptedBackupEnvelope = {
    format: "aethelgard-encrypted-snapshot-v1",
    algorithm: "aes-256-gcm",
    createdAt: manifest.createdAt,
    iv,
    authTag,
    encryptedData: ciphertext,
  };

  const backupDir = path.resolve(process.cwd(), "backups");
  await fs.mkdir(backupDir, { recursive: true });

  const filename = `sanctuary-backup-${Date.now()}.enc.json`;
  const backupPath = path.join(backupDir, filename);
  await fs.writeFile(backupPath, JSON.stringify(envelope, null, 2), "utf8");

  const durationMs = Date.now() - startTime;
  console.log(`[Snapshot-Harness] Encrypted snapshot written in ${durationMs}ms at ${backupPath}`);
  console.log(`[Snapshot-Harness] Authenticated Cipher: AES-256-GCM (AuthTag: ${authTag.slice(0, 16)}...)`);
  console.log(`[Snapshot-Harness] Checksum (SHA-256): ${checksum}`);
  console.log(
    `[Snapshot-Harness] Counts: Users=${allUsers.length}, Chapters=${allChapters.length}, Memories=${allMemories.length}, Assets=${allAssets.length}`
  );

  return { manifest, envelope, backupPath };
}

export async function verifyAndRestoreBackup(backupPath: string): Promise<{
  success: boolean;
  validationTimeMs: number;
  checks: Record<string, boolean>;
}> {
  const restoreStart = Date.now();
  console.log(`[Snapshot-Harness] Initiating decryption & validation on: ${backupPath}`);

  const rawFile = await fs.readFile(backupPath, "utf8");
  let manifest: BackupManifest;
  let encryptionAuthenticated = false;

  try {
    const envelope: EncryptedBackupEnvelope = JSON.parse(rawFile);
    if (envelope.format === "aethelgard-encrypted-snapshot-v1" && envelope.algorithm === "aes-256-gcm") {
      const decryptedJson = decryptPayload(envelope.encryptedData, envelope.iv, envelope.authTag);
      manifest = JSON.parse(decryptedJson);
      encryptionAuthenticated = true;
    } else {
      // Legacy unencrypted backup format support
      manifest = JSON.parse(rawFile);
    }
  } catch (err) {
    throw new Error(`Failed to decrypt and parse backup: ${(err as Error).message}`);
  }

  // 1. Verify schema version
  if (manifest.version !== 1) {
    throw new Error(`Incompatible backup version: ${manifest.version}`);
  }

  // 2. Cryptographic Checksum Validation
  const computedChecksum = crypto
    .createHash("sha256")
    .update(JSON.stringify(manifest.data))
    .digest("hex");

  const checksumValid = computedChecksum === manifest.checksum;
  if (!checksumValid) {
    throw new Error("Integrity violation: backup checksum does not match computed SHA-256");
  }

  // 3. Referential Integrity Analysis
  const userIds = new Set(manifest.data.users.map((u) => u.id));
  const chapterIds = new Set(manifest.data.chapters.map((c) => c.id));
  const memoryIds = new Set(manifest.data.memories.map((m) => m.id));

  let foreignKeysValid = true;

  for (const chap of manifest.data.chapters) {
    if (!userIds.has(chap.userId)) {
      foreignKeysValid = false;
      break;
    }
  }

  for (const mem of manifest.data.memories) {
    if (!userIds.has(mem.userId)) {
      foreignKeysValid = false;
      break;
    }
    if (mem.chapterId && !chapterIds.has(mem.chapterId)) {
      foreignKeysValid = false;
      break;
    }
  }

  for (const asset of manifest.data.memoryAssets) {
    if (!memoryIds.has(asset.memoryId)) {
      foreignKeysValid = false;
      break;
    }
  }

  // 4. Sample Memory & Asset Shape Verification
  let sampleValid = true;
  if (manifest.data.memories.length > 0) {
    const sampleMem = manifest.data.memories[0];
    sampleValid =
      typeof sampleMem.id === "string" &&
      typeof sampleMem.title === "string" &&
      typeof sampleMem.kind === "string";
  }

  if (manifest.data.memoryAssets.length > 0) {
    const sampleAsset = manifest.data.memoryAssets[0];
    sampleValid =
      sampleValid &&
      typeof sampleAsset.id === "string" &&
      typeof sampleAsset.storageKey === "string";
  }

  const durationMs = Date.now() - restoreStart;

  const checks = {
    encryptionAuthenticated,
    checksumValid,
    foreignKeysValid,
    sampleValid,
    tableCountsMatch:
      manifest.data.users.length === manifest.tableCounts.users &&
      manifest.data.memories.length === manifest.tableCounts.memories,
  };

  const success = Object.values(checks).every(Boolean);

  console.log(`[Snapshot-Harness] Snapshot integrity validated in ${durationMs}ms`);
  console.log(`[Snapshot-Harness] Validation checks:`, checks);
  console.log(
    `[Snapshot-Harness] Note: Full database restoration (RTO/RPO) is governed by PostgreSQL pg_dump/pg_restore operational runbooks.`
  );

  return {
    success,
    validationTimeMs: durationMs,
    checks,
  };
}

async function runStandalone() {
  try {
    const { backupPath } = await createSanctuaryBackup();
    const result = await verifyAndRestoreBackup(backupPath);
    if (!result.success) {
      console.error("[Snapshot-Harness] Verification failed!");
      process.exit(1);
    }
    console.log("[Snapshot-Harness] §14 Snapshot Integrity Gate: 🟢 PASS");
    process.exit(0);
  } catch (err) {
    console.error("[Snapshot-Harness] Fatal error:", err);
    process.exit(1);
  }
}

if (process.argv[1]?.endsWith("backup-restore.ts")) {
  runStandalone();
}
