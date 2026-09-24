import { describe, it, expect, beforeAll } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, sessions, chapters, memories, memoryAssets } from "@/lib/db/schema";
import { createSession } from "@/lib/auth/session";
import { AUTH_CONSTANTS } from "@/lib/auth/types";
import { getMemories, getAdjacentMemoryIds } from "@/lib/data/memories";
import { POST as createMemoryHandler } from "@/app/api/admin/memories/route";
import { PATCH as updateMemoryHandler, DELETE as deleteMemoryHandler } from "@/app/api/admin/memories/[id]/route";
import { GET as exportHandler } from "@/app/api/admin/export/route";
import type { AuthenticatedUser } from "@/lib/auth/types";

describe("Phase 5: Experience Completion & Surface Interoperability", () => {
  let adminUser: AuthenticatedUser;
  let adminToken: string;
  let viewerUser: AuthenticatedUser;
  let viewerToken: string;

  let chapter1Id: string;
  let chapter2Id: string;
  let timelineMem1Id: string;
  let timelineMem2Id: string;
  let timelineMem3Id: string;
  let letterMemId: string;
  let futureMemId: string;
  let searchTargetId: string;

  beforeAll(async () => {
    // Clean database in reverse dependency order
    await db.delete(memoryAssets);
    await db.delete(memories);
    await db.delete(chapters);
    await db.delete(sessions);
    await db.delete(users);

    const now = new Date();

    // 1. Create Admin
    const [admin] = await db
      .insert(users)
      .values({
        role: "admin",
        passphraseHash: "dummy-admin-hash-p5",
      })
      .returning();
    adminUser = { id: admin.id, role: "admin", createdAt: admin.createdAt };
    const adminSession = await createSession(admin.id);
    adminToken = adminSession.rawToken;

    // 2. Create Viewer
    const [viewer] = await db
      .insert(users)
      .values({
        role: "viewer",
        passphraseHash: "dummy-viewer-hash-p5",
      })
      .returning();
    viewerUser = { id: viewer.id, role: "viewer", createdAt: viewer.createdAt };
    const viewerSession = await createSession(viewer.id);
    viewerToken = viewerSession.rawToken;

    // 3. Create Chapters for Viewer
    const [chap1] = await db
      .insert(chapters)
      .values({
        userId: viewer.id,
        title: "First Voyage",
        sortOrder: 1,
      })
      .returning();
    chapter1Id = chap1.id;

    const [chap2] = await db
      .insert(chapters)
      .values({
        userId: viewer.id,
        title: "High Horizon",
        sortOrder: 2,
      })
      .returning();
    chapter2Id = chap2.id;

    // 4. Seed Diverse Memories for Viewer
    // Timeline memory 1: Year 2022
    const [t1] = await db
      .insert(memories)
      .values({
        userId: viewer.id,
        chapterId: chapter1Id,
        kind: "standard",
        title: "Old Port Arrival",
        description: "Docking at the quiet harbor as lanterns flickered",
        memoryDate: "2022-04-10",
        emotion: "nostalgia",
        isFavorite: false,
        sortOrder: 1,
        createdAt: new Date(2022, 3, 10),
      })
      .returning();
    timelineMem1Id = t1.id;

    // Timeline memory 2: Year 2023
    const [t2] = await db
      .insert(memories)
      .values({
        userId: viewer.id,
        chapterId: chapter1Id,
        kind: "milestone",
        title: "The Brass Clocktower",
        description: "Climbing through the clock mechanism at noon",
        memoryDate: "2023-08-20",
        emotion: "wonder",
        isFavorite: true,
        sortOrder: 2,
        createdAt: new Date(2023, 7, 20),
      })
      .returning();
    timelineMem2Id = t2.id;

    // Timeline memory 3: Year 2024
    const [t3] = await db
      .insert(memories)
      .values({
        userId: viewer.id,
        chapterId: chapter2Id,
        kind: "standard",
        title: "Mountain Ridge Summit",
        description: "Standing above the clouds as morning broke",
        memoryDate: "2024-02-14",
        emotion: "peace",
        isFavorite: false,
        sortOrder: 3,
        createdAt: new Date(2024, 1, 14),
      })
      .returning();
    timelineMem3Id = t3.id;

    // Letter memory
    const [letter] = await db
      .insert(memories)
      .values({
        userId: viewer.id,
        chapterId: chapter1Id,
        kind: "letter",
        title: "Midnight Parchment Letter",
        description: "Folded note placed under the brass lamp",
        bodyText: "Dearest companion, time holds no distance when thoughts remain anchored in our sanctuary...",
        memoryDate: "2023-11-05",
        emotion: "longing",
        isFavorite: true,
        sortOrder: 4,
        createdAt: now,
      })
      .returning();
    letterMemId = letter.id;

    // Horizon memory (Future commitment)
    const [future] = await db
      .insert(memories)
      .values({
        userId: viewer.id,
        chapterId: chapter2Id,
        kind: "future",
        title: "The Northern Observatory Journey",
        description: "A commitment to watch the winter auroras from the high plateau",
        memoryDate: "2027-12-21",
        emotion: "excitement",
        isFavorite: false,
        sortOrder: 5,
        createdAt: now,
      })
      .returning();
    futureMemId = future.id;

    // Search target memory
    const [searchTarget] = await db
      .insert(memories)
      .values({
        userId: viewer.id,
        chapterId: chapter2Id,
        kind: "standard",
        title: "Paris Starlit Promenade",
        description: "Walking along the Seine riverbank under amber streetlamps",
        memoryDate: "2024-05-30",
        emotion: "joy",
        isFavorite: true,
        sortOrder: 6,
        createdAt: now,
      })
      .returning();
    searchTargetId = searchTarget.id;
  });

  function createRequest(
    url: string,
    method = "GET",
    token?: string,
    body?: unknown,
    origin = "http://localhost:3000"
  ): Request {
    const headers: Record<string, string> = {
      host: "localhost:3000",
      origin,
    };
    if (token) {
      headers.cookie = `${AUTH_CONSTANTS.SESSION_COOKIE_NAME}=${token}`;
    }
    if (body) {
      headers["content-type"] = "application/json";
    }

    return new Request(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  describe("Sub-Gate 5.1: The Chronicle (Timeline Ordering & Navigation)", () => {
    it("retrieves memories in strict chronological order from viewer session", async () => {
      const result = await getMemories(viewerUser, { limit: 100 });
      const dates = result.memories.map((m) => m.memoryDate).filter(Boolean) as string[];

      // Verify dates are monotonically non-decreasing
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i] >= dates[i - 1]).toBe(true);
      }
    });

    it("correctly resolves sequential adjacent memories for deep view navigation", async () => {
      // Memory 2 (2023-08-20) should have Memory 1 as previous and Letter (2023-11-05) as next
      const adjacent = await getAdjacentMemoryIds(viewerUser, "2023-08-20", timelineMem2Id);
      expect(adjacent.prevId).toBe(timelineMem1Id);
      expect(adjacent.nextId).toBe(letterMemId);
    });
  });

  describe("Sub-Gate 5.2: The Correspondence (Letters Chamber)", () => {
    it("filters exclusively letter memories from the same session", async () => {
      const result = await getMemories(viewerUser, { limit: 50, kind: "letter" });
      expect(result.memories.length).toBe(1);
      expect(result.memories[0].id).toBe(letterMemId);
      expect(result.memories[0].kind).toBe("letter");
      expect(result.memories[0].bodyText).toContain("Dearest companion");
    });
  });

  describe("Sub-Gate 5.3: The Horizon (Future Commitments)", () => {
    it("filters exclusively future commitment memories from the same session", async () => {
      const result = await getMemories(viewerUser, { limit: 50, kind: "future" });
      expect(result.memories.length).toBe(1);
      expect(result.memories[0].id).toBe(futureMemId);
      expect(result.memories[0].kind).toBe("future");
      expect(result.memories[0].title).toBe("The Northern Observatory Journey");
    });
  });

  describe("Sub-Gate 5.4: The Vault (Archive Search, Filters & Favorites)", () => {
    it("executes bounded text search returning only matching memories", async () => {
      const result = await getMemories(viewerUser, { limit: 50, q: "Paris" });
      expect(result.memories.length).toBe(1);
      expect(result.memories[0].id).toBe(searchTargetId);
      expect(result.memories[0].title).toBe("Paris Starlit Promenade");
    });

    it("filters memories by chapter correctly", async () => {
      const resultChap1 = await getMemories(viewerUser, { limit: 50, chapterId: chapter1Id });
      expect(resultChap1.memories.length).toBe(3); // t1, t2, letter
      for (const m of resultChap1.memories) {
        expect(m.chapter?.id).toBe(chapter1Id);
      }

      const resultChap2 = await getMemories(viewerUser, { limit: 50, chapterId: chapter2Id });
      expect(resultChap2.memories.length).toBe(3); // t3, future, searchTarget
      for (const m of resultChap2.memories) {
        expect(m.chapter?.id).toBe(chapter2Id);
      }
    });

    it("filters memories by emotion tag", async () => {
      const result = await getMemories(viewerUser, { limit: 50, emotion: "nostalgia" });
      expect(result.memories.length).toBe(1);
      expect(result.memories[0].id).toBe(timelineMem1Id);
    });

    it("filters memories by favorites flag", async () => {
      const result = await getMemories(viewerUser, { limit: 50, favorite: true });
      expect(result.memories.length).toBe(3); // t2, letter, searchTarget
      for (const m of result.memories) {
        expect(m.isFavorite).toBe(true);
      }
    });

    it("filters with combined multi-attribute criteria", async () => {
      // Chapter 1 + favorite: true
      const result = await getMemories(viewerUser, {
        limit: 50,
        chapterId: chapter1Id,
        favorite: true,
      });
      expect(result.memories.length).toBe(2); // t2, letter
    });
  });

  describe("Sub-Gate 5.5: Admin Memory CRUD Operations", () => {
    let newAdminCreatedMemoryId: string;

    it("rejects non-admin (viewer) memory creation with 403", async () => {
      const req = createRequest("http://localhost:3000/api/admin/memories", "POST", viewerToken, {
        kind: "standard",
        title: "Unauthorized Memory",
      });
      const res = await createMemoryHandler(req);
      expect(res.status).toBe(403);
    });

    it("creates a new memory artifact via POST /api/admin/memories", async () => {
      const req = createRequest("http://localhost:3000/api/admin/memories", "POST", adminToken, {
        kind: "standard",
        title: "Admin Created Celestial Memory",
        description: "Cataloged in the archive",
        memoryDate: "2025-01-01",
        chapterId: chapter1Id,
        emotion: "gratitude",
        isFavorite: true,
      });
      const res = await createMemoryHandler(req);
      expect(res.status).toBe(201);
      expect(res.headers.get("Cache-Control")).toContain("no-store");

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.memory.title).toBe("Admin Created Celestial Memory");
      expect(json.data.memory.emotion).toBe("gratitude");
      newAdminCreatedMemoryId = json.data.memoryId;
    });

    it("updates mutable fields via PATCH /api/admin/memories/[id]", async () => {
      const req = createRequest(
        `http://localhost:3000/api/admin/memories/${newAdminCreatedMemoryId}`,
        "PATCH",
        adminToken,
        {
          title: "Admin Updated Memory Title",
          emotion: "joy",
          isFavorite: false,
        }
      );
      const res = await updateMemoryHandler(req, {
        params: Promise.resolve({ id: newAdminCreatedMemoryId }),
      });
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.memory.title).toBe("Admin Updated Memory Title");
      expect(json.data.memory.emotion).toBe("joy");
      expect(json.data.memory.isFavorite).toBe(false);
    });

    it("soft-deletes memory via DELETE /api/admin/memories/[id]", async () => {
      const req = createRequest(
        `http://localhost:3000/api/admin/memories/${newAdminCreatedMemoryId}`,
        "DELETE",
        adminToken
      );
      const res = await deleteMemoryHandler(req, {
        params: Promise.resolve({ id: newAdminCreatedMemoryId }),
      });
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);

      // Verify row is soft deleted in DB
      const [deletedRow] = await db
        .select()
        .from(memories)
        .where(eq(memories.id, newAdminCreatedMemoryId));
      expect(deletedRow.deletedAt).not.toBeNull();

      // Verify excluded from viewer memory list
      const viewerList = await getMemories(adminUser, { limit: 100 });
      expect(viewerList.memories.find((m) => m.id === newAdminCreatedMemoryId)).toBeUndefined();
    });
  });

  describe("Sub-Gate 5.6: Sanctuary Data Export (GET /api/admin/export)", () => {
    it("rejects non-admin (viewer) export request with 403", async () => {
      const req = createRequest("http://localhost:3000/api/admin/export", "GET", viewerToken);
      const res = await exportHandler(req);
      expect(res.status).toBe(403);
    });

    it("generates complete export JSON with schemaVersion: 1 and zero secrets", async () => {
      const req = createRequest("http://localhost:3000/api/admin/export", "GET", adminToken);
      const res = await exportHandler(req);
      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toContain("application/json");
      expect(res.headers.get("Cache-Control")).toContain("no-store");
      expect(res.headers.get("Content-Disposition")).toContain("attachment; filename=");

      const json = await res.json();
      expect(json.schemaVersion).toBe(1);
      expect(json.exportedAt).toBeDefined();
      expect(Array.isArray(json.chapters)).toBe(true);
      expect(json.chapters.length).toBeGreaterThan(0);
      expect(Array.isArray(json.memories)).toBe(true);
      expect(json.memories.length).toBeGreaterThan(0);

      // Deep security audit of export payload string
      const exportString = JSON.stringify(json);
      expect(exportString).not.toContain("passphraseHash");
      expect(exportString).not.toContain("tokenHash");
      expect(exportString).not.toContain("sessionToken");
      expect(exportString).not.toContain("storageKey");
    });
  });
});
