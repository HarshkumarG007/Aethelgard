import { cookies } from "next/headers";
import { AUTH_CONSTANTS } from "@/lib/auth/types";
import { validateSession, getSessionTokenFromCookies } from "@/lib/auth/session";
import { getMemories } from "@/lib/data/memories";
import { LettersChamber } from "@/components/sanctuary/LettersChamber";

export const metadata = {
  title: "The Correspondence — Aethelgard Sanctuary",
  description: "Private correspondence chamber for written letters, notes, and reflections.",
};

export default async function LettersPage() {
  const cookieStore = await cookies();
  const token = getSessionTokenFromCookies(cookieStore);
  const validation = token ? await validateSession(token) : { valid: false as const };
  const user = validation.valid ? validation.user : null;

  if (!user) return null;

  const result = await getMemories(user, { kind: "letter", limit: 100 });

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <header className="text-center pt-2 pb-6 border-b border-amber-950/60">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-800/40 bg-amber-950/20 text-amber-300 text-xs tracking-widest uppercase mb-3">
          Private Correspondence
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight text-amber-100">
          The Correspondence
        </h1>
        <p className="mt-2 text-sm sm:text-base text-gray-400 max-w-lg mx-auto">
          Unfolding the letters, quiet messages, and sealed words of our shared sanctuary.
        </p>
      </header>

      {/* Chamber Reader */}
      <LettersChamber letters={result.memories} />
    </div>
  );
}
