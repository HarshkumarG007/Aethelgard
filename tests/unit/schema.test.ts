import { describe, it, expect } from "vitest";
import * as schema from "@/lib/db/schema";
import { getTableColumns } from "drizzle-orm";

describe("Phase 0: Database Schema Contract Compliance", () => {
  it("defines all required tables per 03_DATA_API_MEDIA_CONTRACT.md", () => {
    expect(schema.users).toBeDefined();
    expect(schema.chapters).toBeDefined();
    expect(schema.memories).toBeDefined();
    expect(schema.memoryAssets).toBeDefined();
    expect(schema.sessions).toBeDefined();
    expect(schema.auditLogs).toBeDefined();
  });

  it("verifies users table columns", () => {
    const columns = getTableColumns(schema.users);
    expect(columns.id).toBeDefined();
    expect(columns.role).toBeDefined();
    expect(columns.passphraseHash).toBeDefined();
    expect(columns.createdAt).toBeDefined();
    expect(columns.updatedAt).toBeDefined();
  });

  it("verifies memories table columns", () => {
    const columns = getTableColumns(schema.memories);
    expect(columns.id).toBeDefined();
    expect(columns.userId).toBeDefined();
    expect(columns.chapterId).toBeDefined();
    expect(columns.kind).toBeDefined();
    expect(columns.title).toBeDefined();
    expect(columns.description).toBeDefined();
    expect(columns.bodyText).toBeDefined();
    expect(columns.memoryDate).toBeDefined();
    expect(columns.location).toBeDefined();
    expect(columns.emotion).toBeDefined();
    expect(columns.threadKey).toBeDefined();
    expect(columns.sortOrder).toBeDefined();
    expect(columns.isFavorite).toBeDefined();
    expect(columns.isDraft).toBeDefined();
    expect(columns.deletedAt).toBeDefined();
  });

  it("verifies memory_assets table columns", () => {
    const columns = getTableColumns(schema.memoryAssets);
    expect(columns.id).toBeDefined();
    expect(columns.memoryId).toBeDefined();
    expect(columns.type).toBeDefined();
    expect(columns.status).toBeDefined();
    expect(columns.storageKey).toBeDefined();
    expect(columns.filename).toBeDefined();
    expect(columns.mimeType).toBeDefined();
    expect(columns.sizeBytes).toBeDefined();
    expect(columns.checksumSha256).toBeDefined();
  });

  it("verifies sessions table columns", () => {
    const columns = getTableColumns(schema.sessions);
    expect(columns.id).toBeDefined();
    expect(columns.userId).toBeDefined();
    expect(columns.tokenHash).toBeDefined();
    expect(columns.lastSeenAt).toBeDefined();
    expect(columns.expiresAt).toBeDefined();
    expect(columns.revokedAt).toBeDefined();
  });
});
