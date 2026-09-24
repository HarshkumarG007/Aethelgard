import crypto from "node:crypto";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { sessions, users } from "@/lib/db/schema";
import {
  AUTH_CONSTANTS,
  type SessionValidationResult,
  type UserRole,
} from "./types";

export interface CreateSessionResult {
  sessionId: string;
  rawToken: string;
  expiresAt: Date;
}

export function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

/**
 * Creates a new session with an opaque cryptographically random token.
 * Only the SHA-256 hash is stored in PostgreSQL.
 * The raw token is returned once to be set in the __Host-session cookie.
 */
export async function createSession(userId: string): Promise<CreateSessionResult> {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);

  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + AUTH_CONSTANTS.SESSION_ABSOLUTE_LIFETIME_MS
  );

  const [newSession] = await db
    .insert(sessions)
    .values({
      userId,
      tokenHash,
      createdAt: now,
      lastSeenAt: now,
      expiresAt,
    })
    .returning({ id: sessions.id });

  return {
    sessionId: newSession.id,
    rawToken,
    expiresAt,
  };
}

/**
 * Validates a session token from the cookie jar.
 * Enforces:
 * - Opaque token format (64-char hex)
 * - Hash comparison against database
 * - Revocation status
 * - Absolute lifetime expiration (24h)
 * - Idle inactivity timeout (30min)
 */
export async function validateSession(
  rawToken: string
): Promise<SessionValidationResult> {
  if (!rawToken || typeof rawToken !== "string" || rawToken.length !== 64) {
    return { valid: false, error: "UNAUTHENTICATED" };
  }

  const tokenHash = hashToken(rawToken);

  const result = await db
    .select({
      sessionId: sessions.id,
      sessionExpiresAt: sessions.expiresAt,
      sessionLastSeenAt: sessions.lastSeenAt,
      sessionRevokedAt: sessions.revokedAt,
      userId: users.id,
      userRole: users.role,
      userCreatedAt: users.createdAt,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.tokenHash, tokenHash))
    .limit(1);

  if (result.length === 0) {
    return { valid: false, error: "UNAUTHENTICATED" };
  }

  const record = result[0];

  // Check explicit revocation
  if (record.sessionRevokedAt) {
    return { valid: false, error: "REVOKED" };
  }

  const now = new Date();

  // Check absolute lifetime
  if (now > record.sessionExpiresAt) {
    return { valid: false, error: "EXPIRED" };
  }

  // Check idle timeout
  const idleElapsedMs = now.getTime() - record.sessionLastSeenAt.getTime();
  if (idleElapsedMs > AUTH_CONSTANTS.SESSION_IDLE_TIMEOUT_MS) {
    return { valid: false, error: "IDLE_TIMEOUT" };
  }

  // Touch last_seen_at to reset idle window
  await db
    .update(sessions)
    .set({ lastSeenAt: now })
    .where(eq(sessions.id, record.sessionId));

  return {
    valid: true,
    sessionId: record.sessionId,
    user: {
      id: record.userId,
      role: record.userRole as UserRole,
      createdAt: record.userCreatedAt,
    },
  };
}

/**
 * Revokes a session server-side.
 */
export async function revokeSession(sessionId: string): Promise<void> {
  await db
    .update(sessions)
    .set({ revokedAt: new Date() })
    .where(eq(sessions.id, sessionId));
}

/**
 * Rotates an existing session (revokes old, creates new).
 * Used during login or privilege escalation to prevent session fixation.
 */
export async function rotateSession(
  oldSessionId: string | null,
  userId: string
): Promise<CreateSessionResult> {
  if (oldSessionId) {
    await revokeSession(oldSessionId);
  }
  return createSession(userId);
}

/**
 * Returns RFC 6265bis compliant __Host- cookie options.
 * Must have: Secure, Path=/, HttpOnly, SameSite=Strict, and NO Domain attribute.
 */
export function getSessionCookieOptions() {
  const isDev = process.env.NODE_ENV === "development";
  return {
    name: isDev ? "aethelgard_session" : AUTH_CONSTANTS.SESSION_COOKIE_NAME,
    httpOnly: true,
    secure: !isDev,
    sameSite: "strict" as const,
    path: "/",
    maxAge: Math.floor(AUTH_CONSTANTS.SESSION_ABSOLUTE_LIFETIME_MS / 1000),
  };
}

export function getClearSessionCookieOptions() {
  const isDev = process.env.NODE_ENV === "development";
  return {
    name: isDev ? "aethelgard_session" : AUTH_CONSTANTS.SESSION_COOKIE_NAME,
    httpOnly: true,
    secure: !isDev,
    sameSite: "strict" as const,
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  };
}

/**
 * Extracts session token from cookie store, checking production __Host-session,
 * dev fallback aethelgard_session, and legacy session names.
 */
export function getSessionTokenFromCookies(cookieStore: {
  get(name: string): { value: string } | undefined;
}): string | null {
  const cookie =
    cookieStore.get(AUTH_CONSTANTS.SESSION_COOKIE_NAME) ||
    cookieStore.get("aethelgard_session") ||
    cookieStore.get("session");
  return cookie?.value ?? null;
}

