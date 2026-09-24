import { NextResponse } from "next/server";
import { authenticateRequest, createAuthErrorResponse } from "@/lib/auth/guard";
import { validateOrigin } from "@/lib/security/origin";
import { createMemory } from "@/lib/data/memories";
import { createMemorySchema } from "@/lib/validation/memories";

export async function POST(request: Request) {
  try {
    // 1. Enforce strict CSRF Origin check
    if (!validateOrigin(request)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Cross-origin or invalid origin request rejected",
          },
        },
        {
          status: 403,
          headers: {
            "Cache-Control": "no-store, private",
          },
        }
      );
    }

    // 2. Authenticate session & enforce Admin role
    const { user } = await authenticateRequest(request);
    if (user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Admin authorization required to create memories",
          },
        },
        {
          status: 403,
          headers: {
            "Cache-Control": "no-store, private",
          },
        }
      );
    }

    // 3. Parse and validate JSON body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "BAD_REQUEST",
            message: "Invalid JSON body",
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

    const parseResult = createMemorySchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid memory creation parameters",
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

    // 4. Create memory record
    const createdMemory = await createMemory(user, parseResult.data);

    return NextResponse.json(
      {
        success: true,
        data: {
          memoryId: createdMemory.id,
          memory: createdMemory,
        },
      },
      {
        status: 201,
        headers: {
          "Cache-Control": "no-store, private",
        },
      }
    );
  } catch (error) {
    return createAuthErrorResponse(error);
  }
}
