import { NextResponse } from "next/server";
import { authenticateRequest, createAuthErrorResponse } from "@/lib/auth/guard";
import { getMemoryById } from "@/lib/data/memories";
import { memoryIdParamSchema } from "@/lib/validation/memories";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await authenticateRequest(request);
    const { id } = await context.params;

    const parseResult = memoryIdParamSchema.safeParse({ id });
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid memory UUID format",
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

    const memory = await getMemoryById(user, parseResult.data.id);

    return NextResponse.json(
      {
        success: true,
        data: memory,
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
