import {
  eq,
  and,
  asc,
  desc,
  isNull,
  ilike,
  or,
  gt,
  lt,
  inArray,
} from "drizzle-orm";
import { db } from "@/lib/db";
import { memories, chapters, memoryAssets } from "@/lib/db/schema";
import type { AuthenticatedUser } from "@/lib/auth/types";
import { AuthError } from "@/lib/auth/guard";
import type { MemoryQueryParams } from "@/lib/validation/memories";

export interface SafeMemoryAsset {
  id: string;
  type: "image" | "video" | "audio" | "document";
  status: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
  isPrimary: boolean;
  availableVariants: string[];
}

export interface MemorySummary {
  id: string;
  kind: "standard" | "letter" | "milestone" | "future";
  title: string;
  description: string | null;
  bodyText: string | null;
  memoryDate: string | null;
  location: { name?: string; lat?: number; lng?: number } | null;
  emotion: string | null;
  threadKey: string | null;
  sortOrder: number;
  isFavorite: boolean;
  isDraft: boolean;
  chapter: {
    id: string;
    title: string;
  } | null;
  assets: SafeMemoryAsset[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedMemoriesResult {
  memories: MemorySummary[];
  nextCursor: string | null;
}

/**
 * Strips all internal secrets, storage keys, and storage paths from asset records.
 * Returns only safe metadata and available variant names.
 */
function sanitizeAssets(
  rawAssets: Array<typeof memoryAssets.$inferSelect>
): SafeMemoryAsset[] {
  return rawAssets.map((asset) => {
    let variants: string[] = [];
    if (asset.variants && typeof asset.variants === "object") {
      variants = Object.keys(asset.variants);
    }

    return {
      id: asset.id,
      type: asset.type as SafeMemoryAsset["type"],
      status: asset.status,
      filename: asset.filename,
      mimeType: asset.mimeType,
      sizeBytes: asset.sizeBytes,
      width: asset.width,
      height: asset.height,
      durationSeconds: asset.durationSeconds,
      isPrimary: asset.isPrimary,
      availableVariants: variants,
    };
  });
}

/**
 * Builds cursor string from memoryDate and ID.
 */
function encodeCursor(memoryDate: string | null, id: string): string {
  const datePart = memoryDate || "0000-00-00";
  return Buffer.from(`${datePart}_${id}`).toString("base64url");
}

/**
 * Decodes cursor string into date and ID components.
 */
function decodeCursor(cursor: string): { datePart: string; idPart: string } | null {
  try {
    const raw = Buffer.from(cursor, "base64url").toString("utf-8");
    const [datePart, idPart] = raw.split("_");
    if (!datePart || !idPart) return null;
    return { datePart, idPart };
  } catch {
    return null;
  }
}

/**
 * Queries memories authorized for the authenticated principal.
 * - Enforces principal ownership for viewers.
 * - Excludes soft-deleted records.
 * - Excludes drafts for non-admins.
 * - Never returns storage keys or sensitive credentials.
 * - Supports bounded search, multi-attribute filtering, and cursor pagination.
 */
export async function getMemories(
  principal: AuthenticatedUser,
  params: MemoryQueryParams
): Promise<PaginatedMemoriesResult> {
  const limit = Math.min(Math.max(params.limit || 50, 1), 100);

  // Base conditions: soft deletion check
  const conditions = [isNull(memories.deletedAt)];

  // Authorization: viewer only gets their own non-draft memories
  if (principal.role !== "admin") {
    conditions.push(eq(memories.userId, principal.id));
    conditions.push(eq(memories.isDraft, false));
  }

  // Filter: chapter
  if (params.chapterId) {
    conditions.push(eq(memories.chapterId, params.chapterId));
  }

  // Filter: kind
  if (params.kind) {
    conditions.push(eq(memories.kind, params.kind));
  }

  // Filter: emotion
  if (params.emotion) {
    conditions.push(eq(memories.emotion, params.emotion));
  }

  // Filter: favorite
  if (params.favorite !== undefined) {
    conditions.push(eq(memories.isFavorite, params.favorite));
  }

  // Bounded text search: sanitize input to prevent injection / excessive wildcards
  if (params.q) {
    const sanitizedQuery = params.q.replace(/[%_]/g, "\\$&").trim();
    if (sanitizedQuery.length > 0) {
      const searchPattern = `%${sanitizedQuery}%`;
      conditions.push(
        or(
          ilike(memories.title, searchPattern),
          ilike(memories.description, searchPattern)
        )!
      );
    }
  }

  // Cursor pagination
  if (params.cursor) {
    const decoded = decodeCursor(params.cursor);
    if (decoded) {
      conditions.push(
        or(
          gt(memories.memoryDate, decoded.datePart),
          and(
            eq(memories.memoryDate, decoded.datePart),
            gt(memories.id, decoded.idPart)
          )
        )!
      );
    }
  }

  // Fetch limit + 1 to detect nextCursor
  const rows = await db
    .select({
      memory: memories,
      chapterTitle: chapters.title,
      chapterSortOrder: chapters.sortOrder,
    })
    .from(memories)
    .leftJoin(chapters, eq(memories.chapterId, chapters.id))
    .where(and(...conditions))
    .orderBy(
      asc(memories.memoryDate),
      asc(memories.sortOrder),
      asc(memories.createdAt),
      asc(memories.id)
    )
    .limit(limit + 1);

  const hasNextPage = rows.length > limit;
  const resultRows = hasNextPage ? rows.slice(0, limit) : rows;

  const memoryIds = resultRows.map((r) => r.memory.id);

  // Fetch assets for returned memories
  const rawAssets =
    memoryIds.length > 0
      ? await db
          .select()
          .from(memoryAssets)
          .where(
            and(
              inArray(memoryAssets.memoryId, memoryIds),
              isNull(memoryAssets.deletedAt)
            )
          )
      : [];

  const assetsByMemoryId = new Map<string, SafeMemoryAsset[]>();
  for (const asset of rawAssets) {
    const safe = sanitizeAssets([asset])[0];
    const existing = assetsByMemoryId.get(asset.memoryId) || [];
    existing.push(safe);
    assetsByMemoryId.set(asset.memoryId, existing);
  }

  const memorySummaries: MemorySummary[] = resultRows.map((r) => {
    const m = r.memory;
    return {
      id: m.id,
      kind: m.kind as MemorySummary["kind"],
      title: m.title,
      description: m.description,
      bodyText: m.bodyText,
      memoryDate: m.memoryDate,
      location: m.location,
      emotion: m.emotion,
      threadKey: m.threadKey,
      sortOrder: m.sortOrder,
      isFavorite: m.isFavorite,
      isDraft: m.isDraft,
      chapter: m.chapterId
        ? {
            id: m.chapterId,
            title: r.chapterTitle || "Untitled Chapter",
          }
        : null,
      assets: assetsByMemoryId.get(m.id) || [],
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    };
  });

  let nextCursor: string | null = null;
  if (hasNextPage && resultRows.length > 0) {
    const lastItem = resultRows[resultRows.length - 1].memory;
    nextCursor = encodeCursor(lastItem.memoryDate, lastItem.id);
  }

  return {
    memories: memorySummaries,
    nextCursor,
  };
}

/**
 * Retrieves a single memory by ID, strictly enforcing authorization.
 * Non-owner access produces 404 (Not Found) to resist ID enumeration.
 */
export async function getMemoryById(
  principal: AuthenticatedUser,
  memoryId: string
): Promise<MemorySummary> {
  const conditions = [eq(memories.id, memoryId), isNull(memories.deletedAt)];

  if (principal.role !== "admin") {
    conditions.push(eq(memories.userId, principal.id));
    conditions.push(eq(memories.isDraft, false));
  }

  const rows = await db
    .select({
      memory: memories,
      chapterTitle: chapters.title,
    })
    .from(memories)
    .leftJoin(chapters, eq(memories.chapterId, chapters.id))
    .where(and(...conditions))
    .limit(1);

  if (rows.length === 0) {
    throw new AuthError("NOT_FOUND", 404, "Memory not found");
  }

  const m = rows[0].memory;

  // Fetch safe assets
  const rawAssets = await db
    .select()
    .from(memoryAssets)
    .where(
      and(
        eq(memoryAssets.memoryId, memoryId),
        isNull(memoryAssets.deletedAt)
      )
    );

  return {
    id: m.id,
    kind: m.kind as MemorySummary["kind"],
    title: m.title,
    description: m.description,
    bodyText: m.bodyText,
    memoryDate: m.memoryDate,
    location: m.location,
    emotion: m.emotion,
    threadKey: m.threadKey,
    sortOrder: m.sortOrder,
    isFavorite: m.isFavorite,
    isDraft: m.isDraft,
    chapter: m.chapterId
      ? {
          id: m.chapterId,
          title: rows[0].chapterTitle || "Untitled Chapter",
        }
      : null,
    assets: sanitizeAssets(rawAssets),
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
  };
}

/**
 * Returns previous and next memory IDs for sequential navigation.
 */
export async function getAdjacentMemoryIds(
  principal: AuthenticatedUser,
  currentMemoryDate: string | null,
  currentId: string
): Promise<{ prevId: string | null; nextId: string | null }> {
  const baseConditions = [isNull(memories.deletedAt)];
  if (principal.role !== "admin") {
    baseConditions.push(eq(memories.userId, principal.id));
    baseConditions.push(eq(memories.isDraft, false));
  }

  const datePart = currentMemoryDate || "0000-00-00";

  // Previous: memoryDate < datePart OR (memoryDate == datePart AND id < currentId)
  const prevRows = await db
    .select({ id: memories.id })
    .from(memories)
    .where(
      and(
        ...baseConditions,
        or(
          lt(memories.memoryDate, datePart),
          and(eq(memories.memoryDate, datePart), lt(memories.id, currentId))
        )
      )
    )
    .orderBy(desc(memories.memoryDate), desc(memories.id))
    .limit(1);

  // Next: memoryDate > datePart OR (memoryDate == datePart AND id > currentId)
  const nextRows = await db
    .select({ id: memories.id })
    .from(memories)
    .where(
      and(
        ...baseConditions,
        or(
          gt(memories.memoryDate, datePart),
          and(eq(memories.memoryDate, datePart), gt(memories.id, currentId))
        )
      )
    )
    .orderBy(asc(memories.memoryDate), asc(memories.id))
    .limit(1);

  return {
    prevId: prevRows.length > 0 ? prevRows[0].id : null,
    nextId: nextRows.length > 0 ? nextRows[0].id : null,
  };
}

export interface SanctuaryExport {
  schemaVersion: number;
  exportedAt: string;
  chapters: Array<{
    id: string;
    title: string;
    description: string | null;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
  }>;
  memories: MemorySummary[];
}

/**
 * Creates a new memory artifact.
 */
export async function createMemory(
  principal: AuthenticatedUser,
  input: import("@/lib/validation/memories").CreateMemoryInput
): Promise<MemorySummary> {
  if (principal.role !== "admin") {
    throw new AuthError("FORBIDDEN", 403, "Admin authorization required to create memories");
  }

  // If chapterId provided, verify it exists
  if (input.chapterId) {
    const chapterExists = await db
      .select({ id: chapters.id })
      .from(chapters)
      .where(eq(chapters.id, input.chapterId))
      .limit(1);

    if (chapterExists.length === 0) {
      throw new AuthError("NOT_FOUND", 404, "Specified chapter not found");
    }
  }

  const [created] = await db
    .insert(memories)
    .values({
      userId: principal.id,
      chapterId: input.chapterId || null,
      kind: input.kind,
      title: input.title,
      description: input.description || null,
      bodyText: input.bodyText || null,
      memoryDate: input.memoryDate || null,
      location: input.location || null,
      emotion: input.emotion || null,
      threadKey: input.threadKey || null,
      sortOrder: input.sortOrder ?? 0,
      isFavorite: input.isFavorite ?? false,
      isDraft: input.isDraft ?? false,
    })
    .returning();

  return await getMemoryById(principal, created.id);
}

/**
 * Updates mutable fields of an existing memory artifact.
 */
export async function updateMemory(
  principal: AuthenticatedUser,
  memoryId: string,
  input: import("@/lib/validation/memories").UpdateMemoryInput
): Promise<MemorySummary> {
  // First ensure the memory exists and verify ownership/admin
  const existing = await getMemoryById(principal, memoryId);

  // If chapterId is being updated, verify it exists
  if (input.chapterId) {
    const chapterExists = await db
      .select({ id: chapters.id })
      .from(chapters)
      .where(eq(chapters.id, input.chapterId))
      .limit(1);

    if (chapterExists.length === 0) {
      throw new AuthError("NOT_FOUND", 404, "Specified chapter not found");
    }
  }

  const updateFields: Partial<typeof memories.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (input.kind !== undefined) updateFields.kind = input.kind;
  if (input.title !== undefined) updateFields.title = input.title;
  if (input.description !== undefined) updateFields.description = input.description;
  if (input.bodyText !== undefined) updateFields.bodyText = input.bodyText;
  if (input.memoryDate !== undefined) updateFields.memoryDate = input.memoryDate;
  if (input.location !== undefined) updateFields.location = input.location;
  if (input.emotion !== undefined) updateFields.emotion = input.emotion;
  if (input.chapterId !== undefined) updateFields.chapterId = input.chapterId;
  if (input.isFavorite !== undefined) updateFields.isFavorite = input.isFavorite;
  if (input.isDraft !== undefined) updateFields.isDraft = input.isDraft;
  if (input.sortOrder !== undefined) updateFields.sortOrder = input.sortOrder;
  if (input.threadKey !== undefined) updateFields.threadKey = input.threadKey;

  await db
    .update(memories)
    .set(updateFields)
    .where(and(eq(memories.id, memoryId), isNull(memories.deletedAt)));

  return await getMemoryById(principal, memoryId);
}

/**
 * Soft deletes a memory and all its associated assets.
 */
export async function deleteMemory(
  principal: AuthenticatedUser,
  memoryId: string
): Promise<void> {
  // Verify existence & ownership
  await getMemoryById(principal, memoryId);

  const now = new Date();

  // Multi-step soft-deletion in transaction
  await db.transaction(async (tx) => {
    // 1. Soft delete memory
    await tx
      .update(memories)
      .set({ deletedAt: now, updatedAt: now })
      .where(eq(memories.id, memoryId));

    // 2. Cascade soft-delete memory assets
    await tx
      .update(memoryAssets)
      .set({ deletedAt: now, updatedAt: now })
      .where(eq(memoryAssets.memoryId, memoryId));
  });
}

/**
 * Exports complete sanctuary metadata with schema versioning.
 * Strictly excludes secrets, passphrases, and raw storage keys.
 */
export async function exportSanctuaryData(
  principal: AuthenticatedUser
): Promise<SanctuaryExport> {
  if (principal.role !== "admin") {
    throw new AuthError("FORBIDDEN", 403, "Admin authorization required for data export");
  }

  const [allChapters, memoriesResult] = await Promise.all([
    db
      .select({
        id: chapters.id,
        title: chapters.title,
        description: chapters.description,
        sortOrder: chapters.sortOrder,
        createdAt: chapters.createdAt,
        updatedAt: chapters.updatedAt,
      })
      .from(chapters)
      .orderBy(asc(chapters.sortOrder)),
    getMemories(principal, { limit: 100 }),
  ]);

  return {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    chapters: allChapters,
    memories: memoriesResult.memories,
  };
}

