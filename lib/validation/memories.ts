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

export const locationSchema = z
  .object({
    name: z.string().max(255).optional(),
    lat: z.number().min(-90).max(90).optional(),
    lng: z.number().min(-180).max(180).optional(),
  })
  .nullable()
  .optional();

export const createMemorySchema = z.object({
  kind: memoryKindSchema.default("standard"),
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(255, "Title must not exceed 255 characters"),
  description: z.string().max(2000).nullable().optional(),
  bodyText: z.string().nullable().optional(),
  memoryDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")
    .nullable()
    .optional(),
  location: locationSchema,
  emotion: memoryEmotionSchema.nullable().optional(),
  chapterId: z.string().uuid("Invalid chapter ID").nullable().optional(),
  isFavorite: z.boolean().optional().default(false),
  isDraft: z.boolean().optional().default(false),
  sortOrder: z.number().int().optional().default(0),
  threadKey: z.string().max(255).nullable().optional(),
});

export type CreateMemoryInput = z.infer<typeof createMemorySchema>;

export const updateMemorySchema = createMemorySchema.partial();

export type UpdateMemoryInput = z.infer<typeof updateMemorySchema>;

