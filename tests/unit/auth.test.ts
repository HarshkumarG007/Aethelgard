import { describe, it, expect, beforeEach, beforeAll } from "vitest";
import { hashPassphrase, verifyPassphrase } from "@/lib/auth/argon";
import {
  createSession,
  validateSession,
  revokeSession,
  rotateSession,
  getSessionCookieOptions,
  getClearSessionCookieOptions,
  hashToken,
} from "@/lib/auth/session";
import {
  checkAuthRateLimit,
  recordAuthFailure,
  recordAuthSuccess,
  getRateLimitStore,
} from "@/lib/auth/rateLimit";
import {
  authenticateRequest,
  authorizeAdmin,
  authorizeResource,
  AuthError,
  extractSessionToken,
} from "@/lib/auth/guard";
import { logAuditEvent } from "@/lib/security/audit";
import { db } from "@/lib/db";
import { users, sessions, auditLogs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { POST as verifyHandler } from "@/app/api/auth/verify/route";
import { POST as logoutHandler } from "@/app/api/auth/logout/route";
import { GET as sessionHandler } from "@/app/api/auth/session/route";

describe("Phase 1: Authentication & Session Infrastructure", () => {
  let testViewerId: string;
  let testAdminId: string;
  const testViewerPassphrase = "test-viewer-passphrase-2026";
  const testAdminPassphrase = "test-admin-passphrase-2026";

  beforeAll(async () => {
    await db.delete(sessions);
    await db.delete(users);

    const viewerHash = await hashPassphrase(testViewerPassphrase);
    const adminHash = await hashPassphrase(testAdminPassphrase);

    const [viewer] = await db
      .insert(users)
      .values({
        role: "viewer",
        passphraseHash: viewerHash,
      })
      .returning({ id: users.id });
    testViewerId = viewer.id;

    const [admin] = await db
      .insert(users)
      .values({
        role: "admin",
        passphraseHash: adminHash,
      })
      .returning({ id: users.id });
    testAdminId = admin.id;
  });

  beforeEach(async () => {
    // Clear rate limiter memory store between tests
    await getRateLimitStore().clearAll?.();
  });

  // 1.1 & 1.2: Server-Side Argon2id Password Verification
  describe("1.2 Argon2id Hashing & Verification", () => {
    it("hashes and verifies candidate passphrases server-side correctly", async () => {
      const hash = await hashPassphrase("my-secure-long-passphrase");
      expect(hash).toMatch(/^\$argon2id\$v=19\$m=65536,t=3,p=4\$/);

      const isValid = await verifyPassphrase(hash, "my-secure-long-passphrase");
      expect(isValid).toBe(true);

      const isInvalid = await verifyPassphrase(hash, "wrong-passphrase-attempt");
      expect(isInvalid).toBe(false);
    });

    it("rejects passphrases that do not meet minimum length requirement", async () => {
      await expect(hashPassphrase("short")).rejects.toThrow(
        /minimum length requirement/
      );
    });
  });

  // 1.4 & 1.5: Opaque Session Token & __Host- Cookie Semantics
  describe("1.4 & 1.5 Opaque Random Session Token & Cookie Semantics", () => {
    it("generates 64-char hex opaque session token and stores only SHA-256 in DB", async () => {
      const { rawToken, sessionId } = await createSession(testViewerId);

      expect(rawToken).toHaveLength(64);
      expect(/^[0-9a-f]{64}$/.test(rawToken)).toBe(true);

      const [storedSession] = await db
        .select()
        .from(sessions)
        .where(eq(sessions.id, sessionId));

      expect(storedSession).toBeDefined();
      expect(storedSession.tokenHash).toBe(hashToken(rawToken));
      expect(storedSession.tokenHash).not.toBe(rawToken); // Raw token NEVER in DB
    });

    it("enforces RFC 6265bis __Host- cookie attributes strictly", () => {
      const cookie = getSessionCookieOptions();

      expect(cookie.name).toBe("__Host-session");
      expect(cookie.httpOnly).toBe(true);
      expect(cookie.secure).toBe(true);
      expect(cookie.sameSite).toBe("strict");
      expect(cookie.path).toBe("/");
      expect((cookie as Record<string, unknown>).domain).toBeUndefined(); // __Host- requires NO domain
      expect(cookie.maxAge).toBe(86400); // 24h
    });

    it("provides correct cookie clear configuration on logout", () => {
      const clearCookie = getClearSessionCookieOptions();

      expect(clearCookie.name).toBe("__Host-session");
      expect(clearCookie.maxAge).toBe(0);
      expect(clearCookie.expires.getTime()).toBe(0);
    });
  });

  // 1.6: Session Expiry (Idle & Absolute Limits)
  describe("1.6 Session Expiration (Idle Inactivity & Absolute Limits)", () => {
    it("validates an active session and updates last_seen_at", async () => {
      const { rawToken, sessionId } = await createSession(testViewerId);

      const validation = await validateSession(rawToken);
      expect(validation.valid).toBe(true);
      if (validation.valid) {
        expect(validation.user.id).toBe(testViewerId);
        expect(validation.user.role).toBe("viewer");
        expect(validation.sessionId).toBe(sessionId);
      }
    });

    it("rejects session that exceeds 30-minute idle inactivity timeout", async () => {
      const { rawToken, sessionId } = await createSession(testViewerId);

      // Artificially age last_seen_at by 31 minutes
      const thirtyOneMinAgo = new Date(Date.now() - 31 * 60 * 1000);
      await db
        .update(sessions)
        .set({ lastSeenAt: thirtyOneMinAgo })
        .where(eq(sessions.id, sessionId));

      const validation = await validateSession(rawToken);
      expect(validation.valid).toBe(false);
      if (!validation.valid) {
        expect(validation.error).toBe("IDLE_TIMEOUT");
      }
    });

    it("rejects session that exceeds 24-hour absolute lifetime", async () => {
      const { rawToken, sessionId } = await createSession(testViewerId);

      // Artificially age expires_at into the past
      const past = new Date(Date.now() - 1000);
      await db
        .update(sessions)
        .set({ expiresAt: past })
        .where(eq(sessions.id, sessionId));

      const validation = await validateSession(rawToken);
      expect(validation.valid).toBe(false);
      if (!validation.valid) {
        expect(validation.error).toBe("EXPIRED");
      }
    });
  });

  // 1.7: Logout & Session Revocation
  describe("1.7 Logout & Session Revocation", () => {
    it("revokes session in database and subsequent validations fail", async () => {
      const { rawToken, sessionId } = await createSession(testViewerId);

      await revokeSession(sessionId);

      const validation = await validateSession(rawToken);
      expect(validation.valid).toBe(false);
      if (!validation.valid) {
        expect(validation.error).toBe("REVOKED");
      }
    });

    it("rotates session on login to prevent session fixation", async () => {
      const oldSession = await createSession(testViewerId);
      const newSession = await rotateSession(oldSession.sessionId, testViewerId);

      expect(newSession.rawToken).not.toBe(oldSession.rawToken);

      // Old session must be revoked
      const oldValidation = await validateSession(oldSession.rawToken);
      expect(oldValidation.valid).toBe(false);

      // New session must be valid
      const newValidation = await validateSession(newSession.rawToken);
      expect(newValidation.valid).toBe(true);
    });
  });

  // 1.8: Layered Rate Limiting
  describe("1.8 Layered Rate Limiting", () => {
    it("allows up to 5 attempts and blocks the 6th with retryAfter", async () => {
      const sourceIp = "192.168.1.100";

      for (let i = 0; i < 5; i++) {
        const result = await checkAuthRateLimit(sourceIp);
        expect(result.allowed).toBe(true);
      }

      const blocked = await checkAuthRateLimit(sourceIp);
      expect(blocked.allowed).toBe(false);
      expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    });

    it("resets rate limit on recorded success", async () => {
      const sourceIp = "192.168.1.101";

      await checkAuthRateLimit(sourceIp);
      await recordAuthFailure(sourceIp);

      await recordAuthSuccess(sourceIp);

      const afterReset = await checkAuthRateLimit(sourceIp);
      expect(afterReset.allowed).toBe(true);
      expect(afterReset.remaining).toBe(4);
    });
  });

  // 1.11: AuthGuard & Server Authorization Matrix
  describe("1.11 Server Authorization & Decoupled Admin/Owner Matrix", () => {
    it("allows Admin to access any resource regardless of owner", () => {
      const adminUser = { id: testAdminId, role: "admin" as const, createdAt: new Date() };
      const foreignOwnerId = "foreign-user-uuid";

      expect(() => authorizeResource(adminUser, foreignOwnerId)).not.toThrow();
    });

    it("allows Viewer to access their own resource", () => {
      const viewerUser = { id: testViewerId, role: "viewer" as const, createdAt: new Date() };

      expect(() => authorizeResource(viewerUser, testViewerId)).not.toThrow();
    });

    it("rejects Viewer from accessing another user's resource with 404 (ID enumeration resistance)", () => {
      const viewerUser = { id: testViewerId, role: "viewer" as const, createdAt: new Date() };
      const otherUserId = "other-user-uuid";

      expect(() => authorizeResource(viewerUser, otherUserId)).toThrow(AuthError);
      try {
        authorizeResource(viewerUser, otherUserId);
      } catch (err) {
        expect((err as AuthError).statusCode).toBe(404);
      }
    });

    it("allows Admin to execute administrative operations and rejects Viewer with 403", () => {
      const adminUser = { id: testAdminId, role: "admin" as const, createdAt: new Date() };
      const viewerUser = { id: testViewerId, role: "viewer" as const, createdAt: new Date() };

      expect(() => authorizeAdmin(adminUser)).not.toThrow();

      expect(() => authorizeAdmin(viewerUser)).toThrow(AuthError);
      try {
        authorizeAdmin(viewerUser);
      } catch (err) {
        expect((err as AuthError).statusCode).toBe(403);
      }
    });

    it("rejects unauthenticated requests without session cookie with 401", async () => {
      const request = new Request("http://localhost:3000/api/protected");

      await expect(authenticateRequest(request)).rejects.toThrow(AuthError);
      try {
        await authenticateRequest(request);
      } catch (err) {
        expect((err as AuthError).statusCode).toBe(401);
      }
    });
  });

  // Sanitized Audit Logging
  describe("Sanitized Audit Logging (No Passphrase / Token Leaks)", () => {
    it("redacts any sensitive fields passed in metadata", async () => {
      await logAuditEvent({
        userId: testViewerId,
        action: "login_attempt",
        metadata: {
          passphrase: "plaintext-secret-should-never-log",
          token: "secret-token-value",
          safeField: "safe_public_data",
        },
      });

      const [log] = await db
        .select()
        .from(auditLogs)
        .where(eq(auditLogs.action, "login_attempt"))
        .limit(1);

      expect(log).toBeDefined();
      expect(log.metadata).toEqual({
        passphrase: "[REDACTED]",
        token: "[REDACTED]",
        safeField: "safe_public_data",
      });
    });
  });

  // 1.3 & 1.9 & End-to-End API Route Handlers
  describe("API Route Handlers (verify, logout, session)", () => {
    it("authenticates viewer with valid passphrase and sets __Host-session cookie", async () => {
      const req = new Request("http://localhost:3000/api/auth/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:3000",
        },
        body: JSON.stringify({ passphrase: testViewerPassphrase }),
      });

      const res = await verifyHandler(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.redirect).toBe("/");

      const setCookie = res.headers.get("set-cookie");
      expect(setCookie).toBeDefined();
      expect(setCookie).toContain("__Host-session=");
      expect(setCookie?.toLowerCase()).toContain("httponly");
      expect(setCookie?.toLowerCase()).toContain("samesite=strict");
      expect(setCookie?.toLowerCase()).toContain("secure");
    });

    it("rejects invalid passphrase with generic 401 response", async () => {
      const req = new Request("http://localhost:3000/api/auth/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:3000",
        },
        body: JSON.stringify({ passphrase: "incorrect-passphrase-guess" }),
      });

      const res = await verifyHandler(req);
      expect(res.status).toBe(401);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe("UNAUTHORIZED");
      expect(json.error.message).toBe("Invalid credentials");
      expect(res.headers.get("cache-control")).toBe("no-store");
    });

    it("rate limits repeated login failures returning 429", async () => {
      const sourceIp = "10.0.0.99";

      // 5 failed attempts
      for (let i = 0; i < 5; i++) {
        const req = new Request("http://localhost:3000/api/auth/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": sourceIp,
            Origin: "http://localhost:3000",
          },
          body: JSON.stringify({ passphrase: "bad-passphrase" }),
        });
        await verifyHandler(req);
      }

      // 6th attempt should be blocked
      const blockedReq = new Request("http://localhost:3000/api/auth/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": sourceIp,
          Origin: "http://localhost:3000",
        },
        body: JSON.stringify({ passphrase: testViewerPassphrase }),
      });

      const res = await verifyHandler(blockedReq);
      expect(res.status).toBe(429);
      expect(res.headers.get("retry-after")).toBeDefined();
    });

    it("allows logout to revoke session and clear cookie", async () => {
      const { rawToken, sessionId } = await createSession(testViewerId);

      const req = new Request("http://localhost:3000/api/auth/logout", {
        method: "POST",
        headers: {
          Cookie: `__Host-session=${rawToken}`,
          Origin: "http://localhost:3000",
        },
      });

      const res = await logoutHandler(req);
      expect(res.status).toBe(200);

      const [sessionRecord] = await db
        .select()
        .from(sessions)
        .where(eq(sessions.id, sessionId));

      expect(sessionRecord.revokedAt).not.toBeNull();

      const setCookie = res.headers.get("set-cookie");
      expect(setCookie).toContain("Max-Age=0");
    });

    it("queries session status via GET /api/auth/session", async () => {
      const { rawToken } = await createSession(testAdminId);

      const req = new Request("http://localhost:3000/api/auth/session", {
        method: "GET",
        headers: {
          Cookie: `__Host-session=${rawToken}`,
        },
      });

      const res = await sessionHandler(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.authenticated).toBe(true);
      expect(json.user.role).toBe("admin");
    });
  });
});
