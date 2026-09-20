import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { verifyPassphrase, performDummyVerification } from "@/lib/auth/argon";
import {
  rotateSession,
  getSessionCookieOptions,
  validateSession,
} from "@/lib/auth/session";
import {
  checkAuthRateLimit,
  recordAuthFailure,
  recordAuthSuccess,
} from "@/lib/auth/rateLimit";
import { extractSessionToken } from "@/lib/auth/guard";
import { validateOrigin } from "@/lib/security/origin";
import { logAuditEvent } from "@/lib/security/audit";

const LoginSchema = z.object({
  passphrase: z.string().min(1),
});

function getClientSourceKey(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") || "127.0.0.1";
}

export async function POST(request: Request): Promise<NextResponse> {
  // 1. Origin verification for state modification (CSRF protection)
  if (!validateOrigin(request)) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "FORBIDDEN", message: "Invalid request origin" },
      },
      { status: 403, headers: { "Cache-Control": "no-store" } }
    );
  }

  const sourceKey = getClientSourceKey(request);

  // 2. Layered rate limiting check (source IP + global failure circuit)
  const rateLimit = await checkAuthRateLimit(sourceKey);
  if (!rateLimit.allowed) {
    await logAuditEvent({
      action: "login_rate_limited",
      outcome: "failure",
      metadata: { sourceKey },
    });

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "RATE_LIMITED",
          message: "Too many authentication attempts. Please try again later.",
        },
      },
      {
        status: 429,
        headers: {
          "Cache-Control": "no-store",
          "Retry-After": String(rateLimit.retryAfterSeconds || 60),
        },
      }
    );
  }

  // 3. Payload validation
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    await performDummyVerification();
    await recordAuthFailure(sourceKey);
    return NextResponse.json(
      {
        success: false,
        error: { code: "UNAUTHORIZED", message: "Invalid credentials" },
      },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) {
    await performDummyVerification();
    await recordAuthFailure(sourceKey);
    return NextResponse.json(
      {
        success: false,
        error: { code: "UNAUTHORIZED", message: "Invalid credentials" },
      },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  const { passphrase } = parsed.data;

  // 4. Retrieve candidate users from database
  const candidateUsers = await db.select().from(users);

  let authenticatedUser: (typeof candidateUsers)[number] | null = null;

  for (const user of candidateUsers) {
    const isMatch = await verifyPassphrase(user.passphraseHash, passphrase);
    if (isMatch) {
      authenticatedUser = user;
      break;
    }
  }

  // 5. Authentication Failure branch (Timing-resistant generic response)
  if (!authenticatedUser) {
    await performDummyVerification();
    await recordAuthFailure(sourceKey);
    await logAuditEvent({
      action: "login_failure",
      outcome: "failure",
      metadata: { sourceKey },
    });

    return NextResponse.json(
      {
        success: false,
        error: { code: "UNAUTHORIZED", message: "Invalid credentials" },
      },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  // 6. Authentication Success branch
  await recordAuthSuccess(sourceKey);
  await logAuditEvent({
    userId: authenticatedUser.id,
    action: "login_success",
    outcome: "success",
    metadata: { role: authenticatedUser.role },
  });

  // Session fixation protection: if an existing session cookie is present, rotate it
  let existingSessionId: string | null = null;
  const existingToken = extractSessionToken(request);
  if (existingToken) {
    const existing = await validateSession(existingToken);
    if (existing.valid) {
      existingSessionId = existing.sessionId;
    }
  }

  const { rawToken } = await rotateSession(existingSessionId, authenticatedUser.id);

  const cookieOptions = getSessionCookieOptions();

  const response = NextResponse.json(
    {
      success: true,
      data: {
        redirect: "/",
      },
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );

  response.cookies.set({
    name: cookieOptions.name,
    value: rawToken,
    httpOnly: cookieOptions.httpOnly,
    secure: cookieOptions.secure,
    sameSite: cookieOptions.sameSite,
    path: cookieOptions.path,
    maxAge: cookieOptions.maxAge,
  });

  return response;
}
