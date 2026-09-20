import { z } from "zod";

export const memoryKindSchema = z.enum([
  "standard",
  "letter",
  "milestone",
  "future",
]);

export const memoryEmotionSchema = z.enum([
  "joy",
  "nostalgia",
  "longing",
  "peace",
  "excitement",
  "gratitude",
  "wonder",
]);

export const mediaVariantSchema = z.enum([
  "thumbnail",
  "small",
  "medium",
  "large",
]);

export const memoryQuerySchema = z.object({
  chapterId: z.string().uuid().optional(),
  kind: memoryKindSchema.optional(),
  emotion: memoryEmotionSchema.optional(),
  favorite: z
    .preprocess((val) => {
      if (val === "true" || val === true) return true;
      if (val === "false" || val === false) return false;
      return undefined;
    }, z.boolean().optional()),
  q: z
    .string()
    .trim()
    .max(100, "Search query must not exceed 100 characters")
    .optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cursor: z.string().max(255).optional(),
});

export type MemoryQueryParams = z.infer<typeof memoryQuerySchema>;

export const mediaAccessSchema = z.object({
  assetId: z.string().uuid("Invalid asset UUID format"),
  variant: mediaVariantSchema.default("medium"),
});

export type MediaAccessParams = z.infer<typeof mediaAccessSchema>;

export const memoryIdParamSchema = z.object({
  id: z.string().uuid("Invalid memory UUID format"),
});
