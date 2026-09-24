import { describe, it, expect, beforeAll } from "vitest";
import sharp from "sharp";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, sessions, chapters, memories, memoryAssets } from "@/lib/db/schema";
import { createSession } from "@/lib/auth/session";
import { AUTH_CONSTANTS } from "@/lib/auth/types";
import { getStorage } from "@/lib/storage";
import { validateMagicBytes, isExecutableOrScript } from "@/lib/security/magicBytes";
import { POST as uploadUrlHandler } from "@/app/api/admin/media/upload-url/route";
import { POST as completeHandler } from "@/app/api/admin/media/[assetId]/complete/route";
import { POST as mediaAccessHandler } from "@/app/api/media/access/route";

describe("Phase 4: Media Architecture, Upload Ingestion & Processing Pipeline", () => {
  let adminId: string;
  let adminToken: string;
  let viewerId: string;
  let viewerToken: string;
  let testMemoryId: string;
  let testAssetId: string;

  beforeAll(async () => {
    // Clean database in reverse dependency order
    await db.delete(memoryAssets);
    await db.delete(memories);
    await db.delete(chapters);
    await db.delete(sessions);
    await db.delete(users);

    const now = new Date();

    // 1. Admin user
    const [admin] = await db
      .insert(users)
      .values({
        role: "admin",
        passphraseHash: "dummy-admin-hash",
      })
      .returning();
    adminId = admin.id;
    const adminSession = await createSession(adminId);
    adminToken = adminSession.rawToken;

    // 2. Viewer user
    const [viewer] = await db
      .insert(users)
      .values({
        role: "viewer",
        passphraseHash: "dummy-viewer-hash",
      })
      .returning();
    viewerId = viewer.id;
    const viewerSession = await createSession(viewerId);
    viewerToken = viewerSession.rawToken;

    // 3. Test Chapter & Memory
    const [chapter] = await db
      .insert(chapters)
      .values({
        userId: adminId,
        title: "Chronicles of Media",
      })
      .returning();

    const [memory] = await db
      .insert(memories)
      .values({
        userId: adminId,
        chapterId: chapter.id,
        kind: "standard",
        title: "Luminous Harbor Dawn",
        memoryDate: "2024-06-15",
      })
      .returning();
    testMemoryId = memory.id;
  });

  function createRequest(
    url: string,
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
      method: "POST",
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  function createMinimalWavBuffer(): Buffer {
    const buffer = Buffer.alloc(44);
    buffer.write("RIFF", 0);
    buffer.writeUInt32LE(36, 4);
    buffer.write("WAVE", 8);
    buffer.write("fmt ", 12);
    buffer.writeUInt32LE(16, 16);
    buffer.writeUInt16LE(1, 20); // PCM
    buffer.writeUInt16LE(1, 22); // Mono
    buffer.writeUInt32LE(44100, 24);
    buffer.writeUInt32LE(44100 * 2, 28);
    buffer.writeUInt16LE(2, 32);
    buffer.writeUInt16LE(16, 34);
    buffer.write("data", 36);
    buffer.writeUInt32LE(0, 40);
    return buffer;
  }

  describe("Sub-Gate 4.1: Magic Bytes Sniffing & Disguised Executable Defense", () => {
    it("detects Windows PE / MZ executable header", () => {
      const mzBuffer = Buffer.from("MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00\xff\xff");
      expect(isExecutableOrScript(mzBuffer)).toBe(true);
      expect(validateMagicBytes(mzBuffer, "image/png")).toBe(false);
    });

    it("detects Linux ELF header", () => {
      const elfBuffer = Buffer.from("\x7fELF\x02\x01\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00");
      expect(isExecutableOrScript(elfBuffer)).toBe(true);
      expect(validateMagicBytes(elfBuffer, "image/jpeg")).toBe(false);
    });

    it("detects HTML / script payload disguised as image", () => {
      const htmlBuffer = Buffer.from("<!DOCTYPE html><html><body><script>alert(1)</script></body></html>");
      expect(isExecutableOrScript(htmlBuffer)).toBe(true);
      expect(validateMagicBytes(htmlBuffer, "image/webp")).toBe(false);
    });

    it("validates authentic PNG and JPEG buffers", async () => {
      const pngBuffer = await sharp({
        create: { width: 50, height: 50, channels: 4, background: { r: 255, g: 0, b: 0, alpha: 1 } },
      })
        .png()
        .toBuffer();

      const jpegBuffer = await sharp({
        create: { width: 50, height: 50, channels: 3, background: { r: 0, g: 255, b: 0 } },
      })
        .jpeg()
        .toBuffer();

      expect(validateMagicBytes(pngBuffer, "image/png")).toBe(true);
      expect(validateMagicBytes(jpegBuffer, "image/jpeg")).toBe(true);
      expect(validateMagicBytes(pngBuffer, "image/jpeg")).toBe(false); // MIME mismatch
    });

    it("validates authentic WAV audio buffer", () => {
      const wavBuffer = createMinimalWavBuffer();
      expect(validateMagicBytes(wavBuffer, "audio/wav")).toBe(true);
      expect(validateMagicBytes(wavBuffer, "image/png")).toBe(false);
    });
  });

  describe("Sub-Gate 4.2: POST /api/admin/media/upload-url (Upload Ingestion)", () => {
    it("rejects unauthenticated request with 401", async () => {
      const req = createRequest("http://localhost:3000/api/admin/media/upload-url", undefined, {
        memoryId: testMemoryId,
        filename: "test.jpg",
        contentType: "image/jpeg",
        sizeBytes: 1024,
      });
      const res = await uploadUrlHandler(req);
      expect(res.status).toBe(401);
    });

    it("rejects non-admin (viewer) with 403", async () => {
      const req = createRequest("http://localhost:3000/api/admin/media/upload-url", viewerToken, {
        memoryId: testMemoryId,
        filename: "test.jpg",
        contentType: "image/jpeg",
        sizeBytes: 1024,
      });
      const res = await uploadUrlHandler(req);
      expect(res.status).toBe(403);
    });

    it("rejects invalid CSRF origin with 403", async () => {
      const req = createRequest(
        "http://localhost:3000/api/admin/media/upload-url",
        adminToken,
        {
          memoryId: testMemoryId,
          filename: "test.jpg",
          contentType: "image/jpeg",
          sizeBytes: 1024,
        },
        "https://malicious-site.example.com"
      );
      const res = await uploadUrlHandler(req);
      expect(res.status).toBe(403);
    });

    it("rejects disallowed MIME type with 400", async () => {
      const req = createRequest("http://localhost:3000/api/admin/media/upload-url", adminToken, {
        memoryId: testMemoryId,
        filename: "bad.exe",
        contentType: "application/x-msdownload",
        sizeBytes: 1024,
      });
      const res = await uploadUrlHandler(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error.code).toBe("VALIDATION_ERROR");
    });

    it("rejects oversized upload with 400", async () => {
      // 30MB image > 25MB limit
      const req = createRequest("http://localhost:3000/api/admin/media/upload-url", adminToken, {
        memoryId: testMemoryId,
        filename: "huge.jpg",
        contentType: "image/jpeg",
        sizeBytes: 30 * 1024 * 1024,
      });
      const res = await uploadUrlHandler(req);
      expect(res.status).toBe(400);
    });

    it("rejects directory traversal in filename with 400", async () => {
      const req = createRequest("http://localhost:3000/api/admin/media/upload-url", adminToken, {
        memoryId: testMemoryId,
        filename: "../../../etc/passwd",
        contentType: "image/jpeg",
        sizeBytes: 1024,
      });
      const res = await uploadUrlHandler(req);
      expect(res.status).toBe(400);
    });

    it("generates presigned PUT authorization with 15-minute expiry for valid request", async () => {
      const req = createRequest("http://localhost:3000/api/admin/media/upload-url", adminToken, {
        memoryId: testMemoryId,
        filename: "harbor-dawn.png",
        contentType: "image/png",
        sizeBytes: 10240,
        isPrimary: true,
      });
      const res = await uploadUrlHandler(req);
      expect(res.status).toBe(200);
      expect(res.headers.get("Cache-Control")).toContain("no-store");

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.method).toBe("PUT");
      expect(json.data.uploadUrl).toBeDefined();
      expect(json.data.headers["Content-Type"]).toBe("image/png");

      // Verify expiration is roughly 15 minutes in future (>= 890s)
      const expiry = new Date(json.data.expiresAt).getTime();
      const diffSec = (expiry - Date.now()) / 1000;
      expect(diffSec).toBeGreaterThan(880);
      expect(diffSec).toBeLessThanOrEqual(905);

      // Verify asset row in DB is PENDING
      const [row] = await db
        .select()
        .from(memoryAssets)
        .where(eq(memoryAssets.id, json.data.assetId));
      expect(row.status).toBe("PENDING");
      expect(json.data.assetId).toBeDefined();
    });
  });

  describe("Sub-Gate 4.3: POST /api/admin/media/[assetId]/complete & Sharp Derivative Processing", () => {
    let testStorageKey: string;

    it("creates upload authorization and stages valid image into storage", async () => {
      const req = createRequest("http://localhost:3000/api/admin/media/upload-url", adminToken, {
        memoryId: testMemoryId,
        filename: "valid-harbor.png",
        contentType: "image/png",
        sizeBytes: 50000,
      });
      const res = await uploadUrlHandler(req);
      const json = await res.json();
      testAssetId = json.data.assetId;
      testStorageKey = `media/${testAssetId}/original`;

      // Upload actual valid PNG buffer to storage driver
      const realPngBuffer = await sharp({
        create: { width: 800, height: 600, channels: 4, background: { r: 56, g: 189, b: 248, alpha: 1 } },
      })
        .png()
        .toBuffer();

      const storage = getStorage();
      await storage.putObject(testStorageKey, realPngBuffer, "image/png");

      // Verify storage has it
      const meta = await storage.verifyUploadedObject(testStorageKey);
      expect(meta.sizeBytes).toBe(realPngBuffer.length);
    });

    it("rejects completion if object is missing in storage", async () => {
      // Create another asset record without putting file in storage
      const req = createRequest("http://localhost:3000/api/admin/media/upload-url", adminToken, {
        memoryId: testMemoryId,
        filename: "ghost.png",
        contentType: "image/png",
        sizeBytes: 1024,
      });
      const res = await uploadUrlHandler(req);
      const json = await res.json();
      const ghostAssetId = json.data.assetId;

      const compReq = createRequest(
        `http://localhost:3000/api/admin/media/${ghostAssetId}/complete`,
        adminToken
      );
      const compRes = await completeHandler(compReq, {
        params: Promise.resolve({ assetId: ghostAssetId }),
      });

      expect(compRes.status).toBe(400);
      const compJson = await compRes.json();
      expect(compJson.error.code).toBe("UPLOAD_INVALID");

      // Verify status marked FAILED in DB
      const [failedRow] = await db
        .select()
        .from(memoryAssets)
        .where(eq(memoryAssets.id, ghostAssetId));
      expect(failedRow.status).toBe("FAILED");
    });

    it("rejects completion if file contains disguised executable payload (magic bytes check)", async () => {
      const req = createRequest("http://localhost:3000/api/admin/media/upload-url", adminToken, {
        memoryId: testMemoryId,
        filename: "disguised-trojan.png",
        contentType: "image/png",
        sizeBytes: 2048,
      });
      const res = await uploadUrlHandler(req);
      const json = await res.json();
      const trojanAssetId = json.data.assetId;

      // Put executable bytes in storage
      const storage = getStorage();
      const mzPayload = Buffer.from("MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00\xff\xff");
      await storage.putObject(`media/${trojanAssetId}/original`, mzPayload, "image/png");

      const compReq = createRequest(
        `http://localhost:3000/api/admin/media/${trojanAssetId}/complete`,
        adminToken
      );
      const compRes = await completeHandler(compReq, {
        params: Promise.resolve({ assetId: trojanAssetId }),
      });

      expect(compRes.status).toBe(400);
      const compJson = await compRes.json();
      expect(compJson.error.code).toBe("UPLOAD_INVALID");
    });

    it("completes valid image, executes Sharp processing, and creates all 4 variants", async () => {
      const compReq = createRequest(
        `http://localhost:3000/api/admin/media/${testAssetId}/complete`,
        adminToken
      );
      const compRes = await completeHandler(compReq, {
        params: Promise.resolve({ assetId: testAssetId }),
      });

      expect(compRes.status).toBe(200);
      expect(compRes.headers.get("Cache-Control")).toContain("no-store");

      const compJson = await compRes.json();
      expect(compJson.success).toBe(true);
      expect(compJson.data.status).toBe("READY");
      expect(compJson.data.width).toBe(800);
      expect(compJson.data.height).toBe(600);

      // Verify all 4 variants exist in manifest
      const variants = compJson.data.variants;
      expect(variants.thumbnail).toBeDefined();
      expect(variants.small).toBeDefined();
      expect(variants.medium).toBeDefined();
      expect(variants.large).toBeDefined();

      // Verify storage driver actually contains each generated variant
      const storage = getStorage();
      const thumbMeta = await storage.verifyUploadedObject(variants.thumbnail.storageKey);
      expect(thumbMeta.sizeBytes).toBeGreaterThan(0);

      const medMeta = await storage.verifyUploadedObject(variants.medium.storageKey);
      expect(medMeta.sizeBytes).toBeGreaterThan(0);
    });
  });

  describe("Sub-Gate 4.4: POST /api/media/access (Signed GET & Ephemeral Lifetime)", () => {
    it("authorizes access to processed asset and returns 5-minute signed URL", async () => {
      // Query ready asset
      const [asset] = await db
        .select()
        .from(memoryAssets)
        .where(eq(memoryAssets.id, testAssetId));

      const accessReq = createRequest("http://localhost:3000/api/media/access", adminToken, {
        assetId: asset.id,
        variant: "thumbnail",
      });

      const accessRes = await mediaAccessHandler(accessReq);
      expect(accessRes.status).toBe(200);
      expect(accessRes.headers.get("Cache-Control")).toContain("no-store");

      const json = await accessRes.json();
      expect(json.success).toBe(true);
      expect(json.data.url).toBeDefined();

      // Verify 5-minute expiry (approx 300s)
      const expiry = new Date(json.data.expiresAt).getTime();
      const diffSec = (expiry - Date.now()) / 1000;
      expect(diffSec).toBeGreaterThan(290);
      expect(diffSec).toBeLessThanOrEqual(305);
    });

    it("treats signed URLs as bearer tokens reusable within the expiration window", async () => {
      const [asset] = await db
        .select()
        .from(memoryAssets)
        .where(eq(memoryAssets.id, testAssetId));

      const accessReq1 = createRequest("http://localhost:3000/api/media/access", adminToken, {
        assetId: asset.id,
        variant: "medium",
      });
      const res1 = await mediaAccessHandler(accessReq1);
      const json1 = await res1.json();

      // Request again immediately with same principal
      const accessReq2 = createRequest("http://localhost:3000/api/media/access", adminToken, {
        assetId: asset.id,
        variant: "medium",
      });
      const res2 = await mediaAccessHandler(accessReq2);
      const json2 = await res2.json();

      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);
      expect(json1.data.url).toBeDefined();
      expect(json2.data.url).toBeDefined();
    });

    it("rejects non-owner viewer with 404 (anti-enumeration)", async () => {
      // Memory belongs to admin; viewer tries to access asset
      const [asset] = await db
        .select()
        .from(memoryAssets)
        .where(eq(memoryAssets.id, testAssetId));

      const accessReq = createRequest("http://localhost:3000/api/media/access", viewerToken, {
        assetId: asset.id,
        variant: "large",
      });

      const res = await mediaAccessHandler(accessReq);
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error.code).toBe("NOT_FOUND");
    });
  });
});
