import { NextResponse } from "next/server";
import {
  validateSession,
  revokeSession,
  getClearSessionCookieOptions,
} from "@/lib/auth/session";
import { extractSessionToken } from "@/lib/auth/guard";
import { validateOrigin } from "@/lib/security/origin";
import { logAuditEvent } from "@/lib/security/audit";

export async function POST(request: Request): Promise<NextResponse> {
  if (!validateOrigin(request)) {
    return NextResponse.json(
      { success: false, error: { code: "FORBIDDEN", message: "Invalid request origin" } },
      { status: 403, headers: { "Cache-Control": "no-store" } }
    );
  }

  const token = extractSessionToken(request);
  if (token) {
    const sessionResult = await validateSession(token);
    if (sessionResult.valid) {
      await revokeSession(sessionResult.sessionId);
      await logAuditEvent({
        userId: sessionResult.user.id,
        action: "logout",
        outcome: "success",
      });
    }
  }

  const clearOptions = getClearSessionCookieOptions();

  const response = NextResponse.json(
    {
      success: true,
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );

  response.cookies.set({
    name: clearOptions.name,
    value: "",
    httpOnly: clearOptions.httpOnly,
    secure: clearOptions.secure,
    sameSite: clearOptions.sameSite,
    path: clearOptions.path,
    maxAge: 0,
    expires: new Date(0),
  });

  return response;
}
