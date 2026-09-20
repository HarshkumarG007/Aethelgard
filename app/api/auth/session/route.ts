import { NextResponse } from "next/server";
import { extractSessionToken } from "@/lib/auth/guard";
import { validateSession } from "@/lib/auth/session";

export async function GET(request: Request): Promise<NextResponse> {
  const token = extractSessionToken(request);
  if (!token) {
    return NextResponse.json(
      {
        authenticated: false,
        error: { code: "UNAUTHENTICATED", message: "No active session" },
      },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  const validation = await validateSession(token);
  if (!validation.valid) {
    return NextResponse.json(
      {
        authenticated: false,
        error: { code: validation.error, message: "Session expired or invalid" },
      },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  return NextResponse.json(
    {
      authenticated: true,
      user: {
        id: validation.user.id,
        role: validation.user.role,
      },
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
