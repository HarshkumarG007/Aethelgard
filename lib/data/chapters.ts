import { eq, asc, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { chapters } from "@/lib/db/schema";
import type { AuthenticatedUser } from "@/lib/auth/types";
import { AuthError } from "@/lib/auth/guard";

export interface ChapterSummary {
  id: string;
  title: string;
  description: string | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Retrieves chapters authorized for the authenticated principal.
 * - Viewers receive only their own chapters.
 * - Admins receive all chapters.
 * Ordered by sortOrder ASC, createdAt ASC.
 */
export async function getChapters(
  principal: AuthenticatedUser
): Promise<ChapterSummary[]> {
  const query = db
    .select({
      id: chapters.id,
      title: chapters.title,
      description: chapters.description,
      sortOrder: chapters.sortOrder,
      createdAt: chapters.createdAt,
      updatedAt: chapters.updatedAt,
    })
    .from(chapters);

  if (principal.role !== "admin") {
    return query
      .where(eq(chapters.userId, principal.id))
      .orderBy(asc(chapters.sortOrder), asc(chapters.createdAt));
  }

  return query.orderBy(asc(chapters.sortOrder), asc(chapters.createdAt));
}

/**
 * Retrieves a single chapter by ID, strictly enforcing authorization.
 * Returns 404 if not found or unauthorized to prevent ID enumeration.
 */
export async function getChapterById(
  principal: AuthenticatedUser,
  chapterId: string
): Promise<ChapterSummary> {
  const conditions = [eq(chapters.id, chapterId)];
  if (principal.role !== "admin") {
    conditions.push(eq(chapters.userId, principal.id));
  }

  const [chapter] = await db
    .select({
      id: chapters.id,
      title: chapters.title,
      description: chapters.description,
      sortOrder: chapters.sortOrder,
      createdAt: chapters.createdAt,
      updatedAt: chapters.updatedAt,
    })
    .from(chapters)
    .where(and(...conditions))
    .limit(1);

  if (!chapter) {
    throw new AuthError("NOT_FOUND", 404, "Chapter not found");
  }

  return chapter;
}
