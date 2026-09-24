import { NextResponse } from "next/server";
import { authenticateRequest, createAuthErrorResponse } from "@/lib/auth/guard";
import { validateOrigin } from "@/lib/security/origin";
import { updateMemory, deleteMemory } from "@/lib/data/memories";
import { updateMemorySchema, memoryIdParamSchema } from "@/lib/validation/memories";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    // 1. Strict CSRF Origin check
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
            message: "Admin authorization required to update memories",
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

    const { id } = await params;
    const idParse = memoryIdParamSchema.safeParse({ id });
    if (!idParse.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "BAD_REQUEST",
            message: "Invalid memory UUID",
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

    const parseResult = updateMemorySchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid memory update parameters",
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

    const updated = await updateMemory(user, id, parseResult.data);

    return NextResponse.json(
      {
        success: true,
        data: {
          memory: updated,
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, private",
        },
      }
    );
  } catch (error) {
    return createAuthErrorResponse(error);
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    // 1. Strict CSRF Origin check
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
            message: "Admin authorization required to delete memories",
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

    const { id } = await params;
    const idParse = memoryIdParamSchema.safeParse({ id });
    if (!idParse.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "BAD_REQUEST",
            message: "Invalid memory UUID",
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

    await deleteMemory(user, id);

    return NextResponse.json(
      {
        success: true,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, private",
        },
      }
    );
  } catch (error) {
    return createAuthErrorResponse(error);
  }
}
