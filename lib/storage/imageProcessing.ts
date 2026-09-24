import sharp from "sharp";
import type { MediaStorage, VariantManifest } from "./types";

export interface ImageProcessingResult {
  manifest: VariantManifest;
  originalWidth: number;
  originalHeight: number;
}

export const VARIANT_SPECS = [
  { name: "thumbnail", maxWidth: 200, maxHeight: 113 },
  { name: "small", maxWidth: 400, maxHeight: 225 },
  { name: "medium", maxWidth: 800, maxHeight: 450 },
  { name: "large", maxWidth: 1920, maxHeight: 1080 },
] as const;

/**
 * Pure, deterministic Sharp processing pipeline:
 * 1. Inspect image buffer
 * 2. Auto-orient based on EXIF orientation tag
 * 3. Strip unnecessary EXIF/GPS/IPTC metadata
 * 4. Generate standard WebP variants (thumbnail, small, medium, large)
 * 5. Persist each variant to the underlying storage driver
 * 6. Return populated VariantManifest with dimensions and storageKeys
 */
export async function processImageWithSharp(
  storage: MediaStorage,
  sourceKey: string,
  assetId: string
): Promise<ImageProcessingResult> {
  const originalBuffer = await storage.getObjectBuffer(sourceKey);

  // Initialize Sharp pipeline with strict error checking and orientation normalization
  const baseImage = sharp(originalBuffer, { failOnError: true }).rotate();
  const metadata = await baseImage.metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error("Unable to parse valid image dimensions from source buffer");
  }

  const originalWidth = metadata.width;
  const originalHeight = metadata.height;
  const manifest: VariantManifest = {};

  for (const spec of VARIANT_SPECS) {
    // Resize inside bounds preserving aspect ratio, without upscaling smaller assets
    const resizedPipeline = baseImage
      .clone()
      .resize({
        width: spec.maxWidth,
        height: spec.maxHeight,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 85, effort: 4 });

    const variantBuffer = await resizedPipeline.toBuffer();
    const variantMeta = await sharp(variantBuffer).metadata();

    const storageKey = `media/${assetId}/${spec.name}.webp`;
    await storage.putObject(storageKey, variantBuffer, "image/webp");

    manifest[spec.name] = {
      storageKey,
      width: variantMeta.width || spec.maxWidth,
      height: variantMeta.height || spec.maxHeight,
    };
  }

  return {
    manifest,
    originalWidth,
    originalHeight,
  };
}
