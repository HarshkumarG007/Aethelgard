import { NextResponse } from "next/server";
import { eq, and, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { memoryAssets, memories } from "@/lib/db/schema";
import { authenticateRequest, createAuthErrorResponse } from "@/lib/auth/guard";
import { validateOrigin } from "@/lib/security/origin";
import { mediaAccessSchema } from "@/lib/validation/memories";
import { getStorage } from "@/lib/storage";

export async function POST(request: Request) {
  try {
    // 1. Enforce strict CSRF Origin check on state-modifying requests
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

    // 2. Authenticate session server-side
    const { user } = await authenticateRequest(request);

    // 3. Validate body parameters
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

    const parseResult = mediaAccessSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid media access parameters",
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

    const { assetId, variant } = parseResult.data;

    // 4. Query asset and its parent memory to verify existence and ownership
    const rows = await db
      .select({
        assetId: memoryAssets.id,
        memoryId: memoryAssets.memoryId,
        status: memoryAssets.status,
        storageKey: memoryAssets.storageKey,
        variants: memoryAssets.variants,
        memoryUserId: memories.userId,
        memoryDeletedAt: memories.deletedAt,
        assetDeletedAt: memoryAssets.deletedAt,
      })
      .from(memoryAssets)
      .innerJoin(memories, eq(memoryAssets.memoryId, memories.id))
      .where(eq(memoryAssets.id, assetId))
      .limit(1);

    if (
      rows.length === 0 ||
      rows[0].memoryDeletedAt !== null ||
      rows[0].assetDeletedAt !== null
    ) {
      // 404 to avoid ID enumeration
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Media asset not found",
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

    const asset = rows[0];

    // 5. Authorize ownership (Admins have global access, Viewers only own resources)
    if (user.role !== "admin" && asset.memoryUserId !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Media asset not found",
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

    // 6. Verify asset status is strictly READY (no dev bypass)
    if (asset.status !== "READY") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "ASSET_NOT_READY",
            message: "Media asset is not ready for playback or access",
          },
        },
        {
          status: 409,
          headers: {
            "Cache-Control": "no-store, private",
          },
        }
      );
    }

    // 7. Resolve storage key for requested variant
    let targetStorageKey = asset.storageKey;
    if (asset.variants && typeof asset.variants === "object") {
      const variantRecord = asset.variants as Record<string, string>;
      if (variant in variantRecord && variantRecord[variant]) {
        targetStorageKey = variantRecord[variant];
      } else if (Object.keys(variantRecord).length > 0) {
        // If variants exist but requested variant is not present, fail validation
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "VARIANT_NOT_FOUND",
              message: `Variant '${variant}' is not available for this asset`,
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
    }

    // 8. Generate short-lived (5 min) download authorization via storage driver
    const storage = getStorage();
    const downloadAuth = await storage.createDownloadAuthorization({
      storageKey: targetStorageKey,
      expiresInSeconds: 300, // 5 minutes strictly per contract
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          url: downloadAuth.url,
          expiresAt: downloadAuth.expiresAt,
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
