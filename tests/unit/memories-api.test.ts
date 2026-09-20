import { describe, it, expect, beforeAll } from "vitest";
import { db } from "@/lib/db";
import { users, sessions, chapters, memories, memoryAssets } from "@/lib/db/schema";
import { createSession } from "@/lib/auth/session";
import { AUTH_CONSTANTS } from "@/lib/auth/types";
import { GET as getChaptersHandler } from "@/app/api/chapters/route";
import { GET as getMemoriesHandler } from "@/app/api/memories/route";
import { GET as getMemoryByIdHandler } from "@/app/api/memories/[id]/route";
import { POST as mediaAccessHandler } from "@/app/api/media/access/route";

describe("Phase 2: Accessible 2D Core & API Security", () => {
  let viewerAId: string;
  let viewerASessionToken: string;
  let viewerBId: string;
  let viewerBSessionToken: string;
  let adminId: string;
  let adminSessionToken: string;

  let viewerAChapterId: string;
  let memoryA1Id: string;
  let memoryA2Id: string;
  let memoryB1Id: string;
  let readyAssetId: string;
  let pendingAssetId: string;

  beforeAll(async () => {
    // Clear existing data cleanly in foreign-key order
    await db.delete(memoryAssets);
    await db.delete(memories);
    await db.delete(chapters);
    await db.delete(sessions);
    await db.delete(users);

    const now = new Date();

    // 1. Create Viewer A
    const [viewerA] = await db
      .insert(users)
      .values({
        role: "viewer",
        passphraseHash: "dummy-hash-viewer-a",
      })
      .returning();
    viewerAId = viewerA.id;
    const sessionA = await createSession(viewerAId);
    viewerASessionToken = sessionA.rawToken;

    // 2. Create Viewer B (distinct principal for IDOR / anti-enumeration tests)
    const [viewerB] = await db
      .insert(users)
      .values({
        role: "viewer",
        passphraseHash: "dummy-hash-viewer-b",
      })
      .returning();
    viewerBId = viewerB.id;
    const sessionB = await createSession(viewerBId);
    viewerBSessionToken = sessionB.rawToken;

    // 3. Create Admin
    const [adminUser] = await db
      .insert(users)
      .values({
        role: "admin",
        passphraseHash: "dummy-hash-admin",
      })
      .returning();
    adminId = adminUser.id;
    const sessionAdmin = await createSession(adminId);
    adminSessionToken = sessionAdmin.rawToken;

    // 4. Create Chapter for Viewer A
    const [chapA] = await db
      .insert(chapters)
      .values({
        userId: viewerAId,
        title: "Viewer A Chapter 1",
        description: "Chronicles of Viewer A",
        sortOrder: 0,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    viewerAChapterId = chapA.id;

    // 5. Create Memories for Viewer A
    const [memA1] = await db
      .insert(memories)
      .values({
        userId: viewerAId,
        chapterId: viewerAChapterId,
        kind: "standard",
        title: "Ancient Clocktower Exploration",
        description: "Discovering the brass bells at dawn",
        bodyText: "Long body transcription of clocktower...",
        memoryDate: "2023-05-10",
        emotion: "wonder",
        isFavorite: true,
        sortOrder: 0,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    memoryA1Id = memA1.id;

    const [memA2] = await db
      .insert(memories)
      .values({
        userId: viewerAId,
        chapterId: viewerAChapterId,
        kind: "letter",
        title: "Letter from the High Observatory",
        description: "Sent with wax seal",
        bodyText: "Parchment notes on the equinox...",
        memoryDate: "2023-08-20",
        emotion: "nostalgia",
        isFavorite: false,
        sortOrder: 1,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    memoryA2Id = memA2.id;

    // 6. Create Memory for Viewer B
    const [memB1] = await db
      .insert(memories)
      .values({
        userId: viewerBId,
        kind: "standard",
        title: "Viewer B Private Secret Memory",
        description: "Should never be visible to Viewer A",
        memoryDate: "2023-09-01",
        emotion: "joy",
        sortOrder: 0,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    memoryB1Id = memB1.id;

    // 7. Create Memory Assets for Viewer A (One READY, One PENDING)
    const [readyAsset] = await db
      .insert(memoryAssets)
      .values({
        memoryId: memoryA1Id,
        type: "image",
        status: "READY",
        storageKey: "internal/vault/secret-photo-1.jpg",
        filename: "clocktower.jpg",
        mimeType: "image/jpeg",
        sizeBytes: 204800,
        isPrimary: true,
        variants: {
          thumbnail: "internal/vault/secret-photo-1-thumb.jpg",
          medium: "internal/vault/secret-photo-1-med.jpg",
        },
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    readyAssetId = readyAsset.id;

    const [pendingAsset] = await db
      .insert(memoryAssets)
      .values({
        memoryId: memoryA1Id,
        type: "image",
        status: "PENDING",
        storageKey: "internal/vault/pending-upload.jpg",
        filename: "pending.jpg",
        mimeType: "image/jpeg",
        sizeBytes: 102400,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    pendingAssetId = pendingAsset.id;
  });

  function createAuthRequest(
    url: string,
    method = "GET",
    token?: string,
    body?: unknown,
    origin?: string
  ): Request {
    const headers: Record<string, string> = {
      host: "localhost:3000",
    };

    if (token) {
      headers.cookie = `${AUTH_CONSTANTS.SESSION_COOKIE_NAME}=${token}`;
    }

    if (origin !== undefined) {
      headers.origin = origin;
    } else if (method !== "GET" && method !== "HEAD") {
      // Default to same-origin for unsafe methods unless testing missing origin
      headers.origin = "http://localhost:3000";
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

  describe("GET /api/chapters", () => {
    it("rejects unauthenticated request with 401", async () => {
      const req = createAuthRequest("http://localhost:3000/api/chapters");
      const res = await getChaptersHandler(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(res.headers.get("Cache-Control")).toContain("no-store");
    });

    it("returns chapters scoped to authenticated viewer", async () => {
      const req = createAuthRequest(
        "http://localhost:3000/api/chapters",
        "GET",
        viewerASessionToken
      );
      const res = await getChaptersHandler(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.chapters.length).toBe(1);
      expect(json.data.chapters[0].id).toBe(viewerAChapterId);
      expect(json.data.chapters[0].title).toBe("Viewer A Chapter 1");
    });

    it("returns empty chapters list for user with no chapters", async () => {
      const req = createAuthRequest(
        "http://localhost:3000/api/chapters",
        "GET",
        viewerBSessionToken
      );
      const res = await getChaptersHandler(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.chapters).toEqual([]);
    });
  });

  describe("GET /api/memories", () => {
    it("rejects unauthenticated request with 401", async () => {
      const req = createAuthRequest("http://localhost:3000/api/memories");
      const res = await getMemoriesHandler(req);
      expect(res.status).toBe(401);
    });

    it("returns only memories owned by authenticated viewer (strict ownership)", async () => {
      const req = createAuthRequest(
        "http://localhost:3000/api/memories",
        "GET",
        viewerASessionToken
      );
      const res = await getMemoriesHandler(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.memories.length).toBe(2);

      const ids = json.data.memories.map((m: { id: string }) => m.id);
      expect(ids).toContain(memoryA1Id);
      expect(ids).toContain(memoryA2Id);
      // Strictly excludes Viewer B's memory
      expect(ids).not.toContain(memoryB1Id);
    });

    it("prevents client from elevating privileges or bypassing ownership via query params", async () => {
      // Attacker attempts to pass userId=viewerB or role=admin
      const req = createAuthRequest(
        `http://localhost:3000/api/memories?userId=${viewerBId}&role=admin`,
        "GET",
        viewerASessionToken
      );
      const res = await getMemoriesHandler(req);
      expect(res.status).toBe(200);
      const json = await res.json();

      // Still returns Viewer A's memories only; client parameters cannot elevate or change scope
      const ids = json.data.memories.map((m: { id: string }) => m.id);
      expect(ids).toContain(memoryA1Id);
      expect(ids).not.toContain(memoryB1Id);
    });

    it("filters memories by kind, emotion, and favorite", async () => {
      const req = createAuthRequest(
        "http://localhost:3000/api/memories?kind=letter",
        "GET",
        viewerASessionToken
      );
      const res = await getMemoriesHandler(req);
      const json = await res.json();
      expect(json.data.memories.length).toBe(1);
      expect(json.data.memories[0].id).toBe(memoryA2Id);

      const favReq = createAuthRequest(
        "http://localhost:3000/api/memories?favorite=true",
        "GET",
        viewerASessionToken
      );
      const favRes = await getMemoriesHandler(favReq);
      const favJson = await favRes.json();
      expect(favJson.data.memories.length).toBe(1);
      expect(favJson.data.memories[0].id).toBe(memoryA1Id);
    });

    it("bounds search query length to 100 characters max", async () => {
      const overlongQuery = "a".repeat(101);
      const req = createAuthRequest(
        `http://localhost:3000/api/memories?q=${overlongQuery}`,
        "GET",
        viewerASessionToken
      );
      const res = await getMemoriesHandler(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe("VALIDATION_ERROR");
    });

    it("bounds pagination limit to 100 max", async () => {
      const req = createAuthRequest(
        "http://localhost:3000/api/memories?limit=500",
        "GET",
        viewerASessionToken
      );
      const res = await getMemoriesHandler(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error.code).toBe("VALIDATION_ERROR");
    });

    it("strictly NEVER exposes storageKey in client API response", async () => {
      const req = createAuthRequest(
        "http://localhost:3000/api/memories",
        "GET",
        viewerASessionToken
      );
      const res = await getMemoriesHandler(req);
      const json = await res.json();
      const stringified = JSON.stringify(json);

      // Verify no storage key leaks
      expect(stringified).not.toContain("internal/vault");
      expect(stringified).not.toContain("secret-photo-1.jpg");
      expect(stringified).not.toContain("storageKey");

      // Verify assets contain safe metadata and variant names only
      const memory = json.data.memories.find((m: { id: string }) => m.id === memoryA1Id);
      expect(memory.assets.length).toBeGreaterThan(0);
      expect(memory.assets[0].id).toBe(readyAssetId);
      expect(memory.assets[0].availableVariants.sort()).toEqual(["medium", "thumbnail"]);
      expect(memory.assets[0].storageKey).toBeUndefined();
    });
  });

  describe("GET /api/memories/[id]", () => {
    it("rejects unauthenticated request with 401", async () => {
      const req = createAuthRequest(`http://localhost:3000/api/memories/${memoryA1Id}`);
      const res = await getMemoryByIdHandler(req, {
        params: Promise.resolve({ id: memoryA1Id }),
      });
      expect(res.status).toBe(401);
    });

    it("rejects invalid UUID format with 400 validation error", async () => {
      const req = createAuthRequest(
        "http://localhost:3000/api/memories/not-a-valid-uuid",
        "GET",
        viewerASessionToken
      );
      const res = await getMemoryByIdHandler(req, {
        params: Promise.resolve({ id: "not-a-valid-uuid" }),
      });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns single memory for owner", async () => {
      const req = createAuthRequest(
        `http://localhost:3000/api/memories/${memoryA1Id}`,
        "GET",
        viewerASessionToken
      );
      const res = await getMemoryByIdHandler(req, {
        params: Promise.resolve({ id: memoryA1Id }),
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.id).toBe(memoryA1Id);
      expect(json.data.title).toBe("Ancient Clocktower Exploration");
      expect(res.headers.get("Cache-Control")).toContain("no-store");
    });

    it("returns 404 when viewer attempts to access another user's memory (anti-enumeration)", async () => {
      // Viewer A attempts to access Viewer B's memory
      const req = createAuthRequest(
        `http://localhost:3000/api/memories/${memoryB1Id}`,
        "GET",
        viewerASessionToken
      );
      const res = await getMemoryByIdHandler(req, {
        params: Promise.resolve({ id: memoryB1Id }),
      });
      // Anti-enumeration: must return 404, not 403
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error.code).toBe("NOT_FOUND");
    });

    it("permits admin to access any memory across sanctuary", async () => {
      const req = createAuthRequest(
        `http://localhost:3000/api/memories/${memoryB1Id}`,
        "GET",
        adminSessionToken
      );
      const res = await getMemoryByIdHandler(req, {
        params: Promise.resolve({ id: memoryB1Id }),
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.id).toBe(memoryB1Id);
    });
  });

  describe("POST /api/media/access", () => {
    it("rejects request missing Origin header with 403", async () => {
      const req = createAuthRequest(
        "http://localhost:3000/api/media/access",
        "POST",
        viewerASessionToken,
        { assetId: readyAssetId, variant: "medium" },
        "" // Empty/missing origin
      );
      const res = await mediaAccessHandler(req);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error.code).toBe("FORBIDDEN");
    });

    it("rejects cross-origin request with 403", async () => {
      const req = createAuthRequest(
        "http://localhost:3000/api/media/access",
        "POST",
        viewerASessionToken,
        { assetId: readyAssetId, variant: "medium" },
        "https://malicious-site.example.com"
      );
      const res = await mediaAccessHandler(req);
      expect(res.status).toBe(403);
    });

    it("rejects unauthenticated request with 401", async () => {
      const req = createAuthRequest(
        "http://localhost:3000/api/media/access",
        "POST",
        undefined, // no token
        { assetId: readyAssetId, variant: "medium" },
        "http://localhost:3000"
      );
      const res = await mediaAccessHandler(req);
      expect(res.status).toBe(401);
    });

    it("rejects non-existent asset ID with 404", async () => {
      const req = createAuthRequest(
        "http://localhost:3000/api/media/access",
        "POST",
        viewerASessionToken,
        { assetId: "00000000-0000-0000-0000-000000000000", variant: "medium" },
        "http://localhost:3000"
      );
      const res = await mediaAccessHandler(req);
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error.code).toBe("NOT_FOUND");
    });

    it("rejects non-owner asset access with 404 (anti-enumeration)", async () => {
      // Viewer B tries to access Viewer A's asset
      const req = createAuthRequest(
        "http://localhost:3000/api/media/access",
        "POST",
        viewerBSessionToken,
        { assetId: readyAssetId, variant: "medium" },
        "http://localhost:3000"
      );
      const res = await mediaAccessHandler(req);
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error.code).toBe("NOT_FOUND");
    });

    it("denies access to assets not in READY status (e.g. PENDING) with 409", async () => {
      const req = createAuthRequest(
        "http://localhost:3000/api/media/access",
        "POST",
        viewerASessionToken,
        { assetId: pendingAssetId, variant: "medium" },
        "http://localhost:3000"
      );
      const res = await mediaAccessHandler(req);
      expect(res.status).toBe(409);
      const json = await res.json();
      expect(json.error.code).toBe("ASSET_NOT_READY");
    });

    it("rejects unavailable variant with 400", async () => {
      const req = createAuthRequest(
        "http://localhost:3000/api/media/access",
        "POST",
        viewerASessionToken,
        { assetId: readyAssetId, variant: "small" }, // 'small' was not registered in readyAsset
        "http://localhost:3000"
      );
      const res = await mediaAccessHandler(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error.code).toBe("VARIANT_NOT_FOUND");
    });

    it("successfully issues short-lived bearer token URL for valid READY asset", async () => {
      const req = createAuthRequest(
        "http://localhost:3000/api/media/access",
        "POST",
        viewerASessionToken,
        { assetId: readyAssetId, variant: "medium" },
        "http://localhost:3000"
      );
      const res = await mediaAccessHandler(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.url).toBeDefined();
      expect(typeof json.data.url).toBe("string");
      expect(json.data.expiresAt).toBeDefined();

      // Verify expiration is ~5 minutes into future
      const expiresAt = new Date(json.data.expiresAt).getTime();
      const now = Date.now();
      const diffSeconds = (expiresAt - now) / 1000;
      expect(diffSeconds).toBeGreaterThan(280);
      expect(diffSeconds).toBeLessThanOrEqual(301);

      // Verify private Cache-Control
      expect(res.headers.get("Cache-Control")).toContain("no-store");
      expect(res.headers.get("Cache-Control")).toContain("private");

      // Verify response payload never leaks storage key
      const payloadStr = JSON.stringify(json);
      expect(payloadStr).not.toContain("internal/vault");
      expect(payloadStr).not.toContain("storageKey");
    });
  });
});
