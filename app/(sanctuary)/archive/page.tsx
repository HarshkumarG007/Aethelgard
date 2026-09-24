import { cookies } from "next/headers";
import { AUTH_CONSTANTS } from "@/lib/auth/types";
import { validateSession, getSessionTokenFromCookies } from "@/lib/auth/session";
import { getMemories } from "@/lib/data/memories";
import { getChapters } from "@/lib/data/chapters";
import { VaultArchive } from "@/components/sanctuary/VaultArchive";

export const metadata = {
  title: "The Vault — Aethelgard Sanctuary",
  description: "Search, filter, and access all recorded memories and milestone artifacts.",
};

export default async function ArchivePage() {
  const cookieStore = await cookies();
  const token = getSessionTokenFromCookies(cookieStore);
  const validation = token ? await validateSession(token) : { valid: false as const };
  const user = validation.valid ? validation.user : null;

  if (!user) return null;

  const [chapters, memoriesResult] = await Promise.all([
    getChapters(user),
    getMemories(user, { limit: 100 }),
  ]);

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <header className="text-center pt-2 pb-6 border-b border-background-border">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-800/40 bg-purple-950/20 text-purple-300 text-xs tracking-widest uppercase mb-3">
          The Vault &bull; Full Archive
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight text-white">
          The Vault
        </h1>
        <p className="mt-2 text-sm sm:text-base text-gray-400 max-w-lg mx-auto">
          Explore, filter, and discover across every recorded memory, milestone, and correspondence.
        </p>
      </header>

      {/* Vault Archive Interactive Interface */}
      <VaultArchive
        initialMemories={memoriesResult.memories}
        chapters={chapters}
      />
    </div>
  );
}
