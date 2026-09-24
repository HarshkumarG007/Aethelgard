import { NextResponse } from "next/server";
import { eq, isNull, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { memoryAssets } from "@/lib/db/schema";
import { authenticateRequest, createAuthErrorResponse } from "@/lib/auth/guard";
import { validateOrigin } from "@/lib/security/origin";
import { validateMagicBytes } from "@/lib/security/magicBytes";
import { getStorage } from "@/lib/storage";
import { processImageWithSharp } from "@/lib/storage/imageProcessing";

interface RouteParams {
  params: Promise<{ assetId: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
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
            message: "Admin authorization required for media completion",
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

    const { assetId } = await params;

    // 3. Query asset record
    const rows = await db
      .select()
      .from(memoryAssets)
      .where(and(eq(memoryAssets.id, assetId), isNull(memoryAssets.deletedAt)))
      .limit(1);

    if (rows.length === 0) {
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

    // Status check
    if (asset.status === "READY") {
      return NextResponse.json(
        {
          success: true,
          data: {
            assetId: asset.id,
            status: asset.status,
            variants: asset.variants,
          },
        },
        {
          status: 200,
          headers: {
            "Cache-Control": "no-store, private",
          },
        }
      );
    }

    if (asset.status !== "PENDING" && asset.status !== "UPLOADING") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_STATE",
            message: `Cannot complete media in state: ${asset.status}`,
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

    const storage = getStorage();

    // 4. Verify object presence in storage
    try {
      await storage.verifyUploadedObject(asset.storageKey);
    } catch {
      await db
        .update(memoryAssets)
        .set({ status: "FAILED", errorCode: "STORAGE_VERIFICATION_FAILED" })
        .where(eq(memoryAssets.id, assetId));

      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UPLOAD_INVALID",
            message: "Uploaded object was not found in storage",
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

    // 5. Read buffer and perform deep validation
    let buffer: Buffer;
    try {
      buffer = await storage.getObjectBuffer(asset.storageKey);
    } catch {
      await db
        .update(memoryAssets)
        .set({ status: "FAILED", errorCode: "BUFFER_READ_FAILED" })
        .where(eq(memoryAssets.id, assetId));

      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UPLOAD_INVALID",
            message: "Unable to retrieve uploaded object for validation",
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

    // Validate size discrepancy
    if (buffer.length === 0) {
      await db
        .update(memoryAssets)
        .set({ status: "FAILED", errorCode: "EMPTY_FILE" })
        .where(eq(memoryAssets.id, assetId));

      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UPLOAD_INVALID",
            message: "Uploaded file is empty",
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

    // Validate Magic Bytes against declared MIME type
    const isMagicValid = validateMagicBytes(buffer, asset.mimeType);
    if (!isMagicValid) {
      await db
        .update(memoryAssets)
        .set({ status: "FAILED", errorCode: "INVALID_MAGIC_BYTES" })
        .where(eq(memoryAssets.id, assetId));

      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UPLOAD_INVALID",
            message: "File signature does not match declared Content-Type or contains executable payload",
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

    // 6. Transition to PROCESSING
    await db
      .update(memoryAssets)
      .set({ status: "PROCESSING" })
      .where(eq(memoryAssets.id, assetId));

    // 7. Image variant generation via Sharp
    if (asset.type === "image") {
      try {
        const result = await processImageWithSharp(storage, asset.storageKey, asset.id);

        await db
          .update(memoryAssets)
          .set({
            status: "READY",
            variants: result.manifest,
            width: result.originalWidth,
            height: result.originalHeight,
            updatedAt: new Date(),
          })
          .where(eq(memoryAssets.id, assetId));

        return NextResponse.json(
          {
            success: true,
            data: {
              assetId: asset.id,
              status: "READY",
              type: asset.type,
              width: result.originalWidth,
              height: result.originalHeight,
              variants: result.manifest,
            },
          },
          {
            status: 200,
            headers: {
              "Cache-Control": "no-store, private",
            },
          }
        );
      } catch (err: unknown) {
        await db
          .update(memoryAssets)
          .set({ status: "FAILED", errorCode: "PROCESSING_FAILED" })
          .where(eq(memoryAssets.id, assetId));

        return NextResponse.json(
          {
            success: false,
            error: {
              code: "PROCESSING_FAILED",
              message: (err as Error).message || "Image variant generation failed",
            },
          },
          {
            status: 422,
            headers: {
              "Cache-Control": "no-store, private",
            },
          }
        );
      }
    }

    // 8. Audio / Video media completion (pass-through after validation)
    await db
      .update(memoryAssets)
      .set({
        status: "READY",
        updatedAt: new Date(),
      })
      .where(eq(memoryAssets.id, assetId));

    return NextResponse.json(
      {
        success: true,
        data: {
          assetId: asset.id,
          status: "READY",
          type: asset.type,
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
