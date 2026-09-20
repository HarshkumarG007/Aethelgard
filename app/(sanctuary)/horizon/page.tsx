import { cookies } from "next/headers";
import { AUTH_CONSTANTS } from "@/lib/auth/types";
import { validateSession } from "@/lib/auth/session";
import { getMemories } from "@/lib/data/memories";
import { HorizonExperience } from "@/components/sanctuary/HorizonExperience";

export const metadata = {
  title: "The Horizon — Aethelgard Sanctuary",
  description: "Facing forward toward unwritten dreams, commitments, and days yet to unfold.",
};

export default async function HorizonPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(AUTH_CONSTANTS.SESSION_COOKIE_NAME);
  const validation = await validateSession(sessionCookie!.value);
  const user = validation.valid ? validation.user : null;

  if (!user) return null;

  const result = await getMemories(user, { kind: "future", limit: 100 });

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <header className="text-center pt-2 pb-6 border-b border-emerald-950/60">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-700/40 bg-emerald-950/20 text-emerald-300 text-xs tracking-widest uppercase mb-3">
          The Horizon &bull; Facing Forward
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight text-white">
          The Horizon
        </h1>
        <p className="mt-2 text-sm sm:text-base text-gray-400 max-w-lg mx-auto">
          Where love has geography into the future. Unwritten promises and commitments suspended in light.
        </p>
      </header>

      {/* Interactive Experience */}
      <HorizonExperience promises={result.memories} />
    </div>
  );
}
