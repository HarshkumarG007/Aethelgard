import { NextResponse } from "next/server";
import { authenticateRequest, createAuthErrorResponse } from "@/lib/auth/guard";
import { getChapters } from "@/lib/data/chapters";

export async function GET(request: Request) {
  try {
    const { user } = await authenticateRequest(request);
    const chapters = await getChapters(user);

    return NextResponse.json(
      {
        success: true,
        data: {
          chapters,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, private",
        },
      }
    );
  } catch (error) {
    return createAuthErrorResponse(error);
  }
}
