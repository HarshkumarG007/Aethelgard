import { z } from "zod";

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;

export const ALLOWED_AUDIO_TYPES = [
  "audio/mpeg",
  "audio/mp4",
  "audio/wav",
] as const;

export const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
] as const;

export const ALL_ALLOWED_MEDIA_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  ...ALLOWED_AUDIO_TYPES,
  ...ALLOWED_VIDEO_TYPES,
] as const;

export type AllowedMediaType = (typeof ALL_ALLOWED_MEDIA_TYPES)[number];

export const MEDIA_SIZE_LIMITS: Record<AllowedMediaType, number> = {
  "image/jpeg": 25 * 1024 * 1024,
  "image/png": 25 * 1024 * 1024,
  "image/webp": 25 * 1024 * 1024,
  "image/avif": 25 * 1024 * 1024,
  "audio/mpeg": 50 * 1024 * 1024,
  "audio/mp4": 50 * 1024 * 1024,
  "audio/wav": 50 * 1024 * 1024,
  "video/mp4": 100 * 1024 * 1024,
  "video/webm": 100 * 1024 * 1024,
};

export function getMediaCategory(mimeType: AllowedMediaType): "image" | "audio" | "video" {
  if (ALLOWED_IMAGE_TYPES.includes(mimeType as (typeof ALLOWED_IMAGE_TYPES)[number])) {
    return "image";
  }
  if (ALLOWED_AUDIO_TYPES.includes(mimeType as (typeof ALLOWED_AUDIO_TYPES)[number])) {
    return "audio";
  }
  return "video";
}

export const mediaUploadUrlSchema = z
  .object({
    memoryId: z.string().uuid("Invalid memory ID"),
    filename: z
      .string()
      .min(1, "Filename is required")
      .max(255, "Filename exceeds 255 characters")
      .regex(/^[^/\\?%*:|"<>]+$/, "Filename contains invalid characters")
      .refine((fn) => !fn.includes(".."), "Filename must not contain directory traversal"),
    contentType: z.enum(ALL_ALLOWED_MEDIA_TYPES, {
      errorMap: () => ({ message: "Unsupported or disallowed media MIME type" }),
    }),
    sizeBytes: z.number().int().positive("File size must be positive"),
    isPrimary: z.boolean().optional().default(false),
  })
  .refine(
    (data) => {
      const limit = MEDIA_SIZE_LIMITS[data.contentType];
      return data.sizeBytes <= limit;
    },
    (data) => ({
      message: `File exceeds maximum allowed size for ${data.contentType} (${Math.round(
        MEDIA_SIZE_LIMITS[data.contentType] / (1024 * 1024)
      )}MB)`,
      path: ["sizeBytes"],
    })
  );

export type MediaUploadUrlInput = z.infer<typeof mediaUploadUrlSchema>;
