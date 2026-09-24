import { NextResponse } from "next/server";
import { AUTH_CONSTANTS, type AuthenticatedUser } from "./types";
import { validateSession } from "./session";

export class AuthError extends Error {
  constructor(
    public readonly code: "UNAUTHENTICATED" | "FORBIDDEN" | "NOT_FOUND" | "RATE_LIMITED",
    public readonly statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "AuthError";
  }
}

/**
 * Extracts the raw __Host-session cookie value from standard Request headers.
 */
export function extractSessionToken(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;

  const cookieNames = [
    AUTH_CONSTANTS.SESSION_COOKIE_NAME,
    "aethelgard_session",
    "session",
  ];

  for (const name of cookieNames) {
    const match = cookieHeader
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith(`${name}=`));

    if (match) {
      const token = match.substring(`${name}=`.length);
      if (token) return token;
    }
  }

  return null;
}

/**
 * Server-side authentication guard for API route handlers.
 * Verifies session token in DB, checking absolute lifetime and idle inactivity timeout.
 */
export async function authenticateRequest(
  request: Request
): Promise<{ user: AuthenticatedUser; sessionId: string }> {
  const token = extractSessionToken(request);
  if (!token) {
    throw new AuthError(
      "UNAUTHENTICATED",
      401,
      "Authentication required"
    );
  }

  const validation = await validateSession(token);
  if (!validation.valid) {
    throw new AuthError(
      "UNAUTHENTICATED",
      401,
      "Invalid or expired session"
    );
  }

  return {
    user: validation.user,
    sessionId: validation.sessionId,
  };
}

/**
 * Role-based authorization guard.
 * Requires elevated admin role.
 */
export function authorizeAdmin(user: AuthenticatedUser): void {
  if (user.role !== "admin") {
    throw new AuthError(
      "FORBIDDEN",
      403,
      "Administrative capability required"
    );
  }
}

/**
 * Decoupled Admin vs Owner authorization algorithm.
 * - Admin has global sanctuary scope: can access/manage any resource.
 * - Viewer can only access their own resources.
 * - Non-owner access returns 404 Not Found to prevent UUID enumeration.
 */
export function authorizeResource(
  user: AuthenticatedUser,
  resourceOwnerId: string
): void {
  if (user.role === "admin") {
    return; // Admin authorized
  }

  if (resourceOwnerId === user.id) {
    return; // Owner authorized
  }

  // Not owner, not admin -> 404 to avoid ID enumeration
  throw new AuthError("NOT_FOUND", 404, "Resource not found");
}

/**
 * Formats a standardized AuthError JSON response with Cache-Control: no-store.
 */
export function createAuthErrorResponse(error: unknown): NextResponse {
  if (error instanceof AuthError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      },
      {
        status: error.statusCode,
        headers: {
          "Cache-Control": "no-store, private",
        },
      }
    );
  }

  return NextResponse.json(
    {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
    },
    {
      status: 500,
      headers: {
        "Cache-Control": "no-store, private",
      },
    }
  );
}
