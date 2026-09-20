import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { AUTH_CONSTANTS } from "@/lib/auth/types";
import { validateSession } from "@/lib/auth/session";
import { getMemoryById, getAdjacentMemoryIds } from "@/lib/data/memories";
import { memoryIdParamSchema } from "@/lib/validation/memories";
import { MemoryDeepView } from "@/components/sanctuary/MemoryDeepView";

interface MemoryPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: MemoryPageProps) {
  const { id } = await params;
  const parseResult = memoryIdParamSchema.safeParse({ id });
  if (!parseResult.success) {
    return { title: "Memory Not Found — Aethelgard Sanctuary" };
  }

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(AUTH_CONSTANTS.SESSION_COOKIE_NAME);
  if (!sessionCookie?.value) {
    return { title: "Aethelgard Sanctuary" };
  }

  const validation = await validateSession(sessionCookie.value);
  if (!validation.valid) {
    return { title: "Aethelgard Sanctuary" };
  }

  try {
    const memory = await getMemoryById(validation.user, parseResult.data.id);
    return {
      title: `${memory.title} — Aethelgard Sanctuary`,
      description: memory.description || "Inscribed memory artifact in Aethelgard.",
    };
  } catch {
    return { title: "Memory Not Found — Aethelgard Sanctuary" };
  }
}

export default async function MemoryPage({ params }: MemoryPageProps) {
  const { id } = await params;

  const parseResult = memoryIdParamSchema.safeParse({ id });
  if (!parseResult.success) {
    notFound();
  }

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(AUTH_CONSTANTS.SESSION_COOKIE_NAME);
  if (!sessionCookie?.value) {
    notFound();
  }

  const validation = await validateSession(sessionCookie.value);
  if (!validation.valid) {
    notFound();
  }

  const user = validation.user;

  let memory;
  let prevId: string | null = null;
  let nextId: string | null = null;

  try {
    memory = await getMemoryById(user, parseResult.data.id);
    const adjacent = await getAdjacentMemoryIds(
      user,
      memory.memoryDate,
      memory.id
    );
    prevId = adjacent.prevId;
    nextId = adjacent.nextId;
  } catch {
    // Non-owner access or non-existent memory throws AuthError("NOT_FOUND", 404)
    notFound();
  }

  return (
    <MemoryDeepView
      memory={memory}
      prevId={prevId}
      nextId={nextId}
    />
  );
}
