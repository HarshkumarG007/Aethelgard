import { NextResponse } from "next/server";
import { eq, isNull, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { memories, memoryAssets } from "@/lib/db/schema";
import { authenticateRequest, createAuthErrorResponse } from "@/lib/auth/guard";
import { validateOrigin } from "@/lib/security/origin";
import { mediaUploadUrlSchema, getMediaCategory } from "@/lib/validation/media";
import { getStorage } from "@/lib/storage";

export async function POST(request: Request) {
  try {
    // 1. Strict CSRF Origin Check
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
            message: "Admin authorization required for media upload ingestion",
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

    // 3. Parse and validate body
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

    const parseResult = mediaUploadUrlSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid media upload parameters",
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

    const data = parseResult.data;

    // 4. Verify parent memory exists and is active
    const targetMemory = await db
      .select({ id: memories.id })
      .from(memories)
      .where(and(eq(memories.id, data.memoryId), isNull(memories.deletedAt)))
      .limit(1);

    if (targetMemory.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Parent memory not found",
          },
        },
        {
          status: 404,
          headers: {
            "Cache-Control": "no-store, private",
          },
        }
      );
    }

    // 5. Generate opaque storage key and asset record
    const assetId = crypto.randomUUID();
    const storageKey = `media/${assetId}/original`;
    const category = getMediaCategory(data.contentType);

    await db.insert(memoryAssets).values({
      id: assetId,
      memoryId: data.memoryId,
      type: category,
      status: "PENDING",
      storageKey,
      filename: data.filename,
      mimeType: data.contentType,
      sizeBytes: data.sizeBytes,
      isPrimary: data.isPrimary,
    });

    // 6. Generate presigned PUT authorization (15 min lifetime)
    const storage = getStorage();
    const uploadAuth = await storage.createUploadAuthorization({
      assetId,
      storageKey,
      contentType: data.contentType,
      sizeBytes: data.sizeBytes,
      expiresInSeconds: 900, // 15 minutes per contract
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          assetId,
          uploadUrl: uploadAuth.uploadUrl,
          expiresAt: uploadAuth.expiresAt,
          method: "PUT",
          headers: uploadAuth.headers,
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
