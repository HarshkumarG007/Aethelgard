import { NextResponse } from "next/server";
import { authenticateRequest, createAuthErrorResponse } from "@/lib/auth/guard";
import { getMemories } from "@/lib/data/memories";
import { memoryQuerySchema } from "@/lib/validation/memories";

export async function GET(request: Request) {
  try {
    const { user } = await authenticateRequest(request);

    const { searchParams } = new URL(request.url);
    const queryObj: Record<string, string> = {};
    for (const [key, value] of searchParams.entries()) {
      queryObj[key] = value;
    }

    const parseResult = memoryQuerySchema.safeParse(queryObj);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid query parameters",
            details: parseResult.error.format(),
          },
        },
        {
          status: 400,
          headers: {
            "Cache-Control": "no-store, private",
          },
        }
      );
    }

    const result = await getMemories(user, parseResult.data);

    return NextResponse.json(
      {
        success: true,
        data: result,
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
