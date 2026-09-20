import { cookies } from "next/headers";
import Link from "next/link";
import { AUTH_CONSTANTS } from "@/lib/auth/types";
import { validateSession } from "@/lib/auth/session";
import { getMemories } from "@/lib/data/memories";
import { getChapters } from "@/lib/data/chapters";
import { MemoryCard } from "@/components/sanctuary/MemoryCard";
import { EmptyState } from "@/components/sanctuary/EmptyState";

export const metadata = {
  title: "Upper Archive — Aethelgard Sanctuary",
  description: "The central sanctuary overview of memories, chapters, and correspondence.",
};

const SANCTUARY_SPACES = [
  {
    href: "/timeline",
    title: "The Chronicle",
    subtitle: "Timeline Traversal",
    description: "Follow the journey in chronological order, through moments of joy, discovery, and reflection.",
    icon: "⌛",
    accent: "border-sky-800/40 hover:border-sky-500/60 bg-sky-950/20",
  },
  {
    href: "/letters",
    title: "The Correspondence",
    subtitle: "Letters Chamber",
    description: "A private sanctuary for written letters, intimate notes, and handwritten reflections.",
    icon: "✉",
    accent: "border-amber-800/40 hover:border-amber-500/60 bg-amber-950/20",
  },
  {
    href: "/archive",
    title: "The Vault",
    subtitle: "Search & Grid",
    description: "Browse, filter by emotion, and search through every recorded memory and milestone.",
    icon: "◈",
    accent: "border-purple-800/40 hover:border-purple-500/60 bg-purple-950/20",
  },
  {
    href: "/horizon",
    title: "The Horizon",
    subtitle: "Future Promises",
    description: "Facing forward toward unwritten dreams, unspoken promises, and days waiting to arrive.",
    icon: "✦",
    accent: "border-emerald-800/40 hover:border-emerald-500/60 bg-emerald-950/20",
  },
];

export default async function SanctuaryOverviewPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(AUTH_CONSTANTS.SESSION_COOKIE_NAME);
  const validation = await validateSession(sessionCookie!.value);
  const user = validation.valid ? validation.user : null;

  if (!user) return null;

  const [chapters, memoriesResult] = await Promise.all([
    getChapters(user),
    getMemories(user, { limit: 100 }),
  ]);

  const allMemories = memoriesResult.memories;
  const favorites = allMemories.filter((m) => m.isFavorite);
  const recentMemories = allMemories.slice(0, 6);

  // Group memories by chapter for chapter summaries
  const countByChapter = new Map<string, number>();
  for (const m of allMemories) {
    if (m.chapter?.id) {
      countByChapter.set(m.chapter.id, (countByChapter.get(m.chapter.id) || 0) + 1);
    }
  }

  return (
    <div className="space-y-12 pb-12">
      {/* Sanctuary Hero Banner */}
      <section aria-labelledby="sanctuary-title" className="text-center pt-4 pb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary-light text-xs tracking-widest uppercase mb-4">
          Sanctuary Atmosphere &bull; Level II
        </div>
        <h1
          id="sanctuary-title"
          className="font-serif text-3xl sm:text-5xl font-semibold tracking-tight text-white"
        >
          The Upper Archive
        </h1>
        <p className="mt-3 max-w-xl mx-auto text-base sm:text-lg text-gray-400 font-sans leading-relaxed">
          Where memories have weight, and love has geography.
        </p>
      </section>

      {/* Sanctuary Spaces Navigation Grid */}
      <section aria-labelledby="spaces-heading">
        <h2 id="spaces-heading" className="sr-only">
          Sanctuary Chambers
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SANCTUARY_SPACES.map((space) => (
            <Link
              key={space.href}
              href={space.href}
              className={`group relative flex flex-col justify-between p-6 rounded-xl border backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl focus-visible:ring-2 focus-visible:ring-primary ${space.accent}`}
            >
              <div>
                <div className="text-2xl mb-3 text-primary-light" aria-hidden="true">
                  {space.icon}
                </div>
                <div className="text-[11px] font-mono tracking-wider uppercase text-gray-400">
                  {space.subtitle}
                </div>
                <h3 className="mt-1 font-serif text-xl font-semibold text-white group-hover:text-primary-light transition-colors">
                  {space.title}
                </h3>
                <p className="mt-2 text-xs text-gray-300 leading-relaxed">
                  {space.description}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-background-border/40 text-xs text-gray-400 font-medium flex items-center justify-between">
                <span>Enter chamber</span>
                <span className="group-hover:translate-x-1 transition-transform" aria-hidden="true">&rarr;</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Chapters (Memory Islands) */}
      {chapters.length > 0 && (
        <section aria-labelledby="chapters-heading" className="space-y-4">
          <div className="flex items-center justify-between border-b border-background-border pb-3">
            <div>
              <h2
                id="chapters-heading"
                className="font-serif text-2xl font-semibold text-white tracking-tight"
              >
                Memory Islands
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Chapters organizing the periods of our shared history
              </p>
            </div>
            <span className="text-xs font-mono text-gray-400">
              {chapters.length} {chapters.length === 1 ? "chapter" : "chapters"}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {chapters.map((chapter) => {
              const count = countByChapter.get(chapter.id) || 0;
              return (
                <div
                  key={chapter.id}
                  className="rounded-xl border border-background-border bg-background-surface/60 p-5 backdrop-blur-sm"
                >
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span className="font-mono text-[11px] uppercase tracking-wider text-primary/80">
                      Chapter {chapter.sortOrder + 1}
                    </span>
                    <span className="bg-background-elevated px-2 py-0.5 rounded text-[10px]">
                      {count} {count === 1 ? "memory" : "memories"}
                    </span>
                  </div>
                  <h3 className="mt-2 font-serif text-base font-semibold text-white">
                    {chapter.title}
                  </h3>
                  {chapter.description && (
                    <p className="mt-1 text-xs text-gray-300 line-clamp-2 leading-relaxed">
                      {chapter.description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Favorites Showcase (Semantic Grid) */}
      {favorites.length > 0 && (
        <section aria-labelledby="favorites-heading" className="space-y-4">
          <div className="flex items-center justify-between border-b border-background-border pb-3">
            <div>
              <h2
                id="favorites-heading"
                className="font-serif text-2xl font-semibold text-white tracking-tight"
              >
                Treasured Moments
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Cherished milestones marked with special significance
              </p>
            </div>
            <span className="text-xs font-mono text-amber-400/90">
              ★ {favorites.length}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((memory) => (
              <MemoryCard key={memory.id} memory={memory} headingLevel="h3" />
            ))}
          </div>
        </section>
      )}

      {/* Recent Memories */}
      <section aria-labelledby="recent-heading" className="space-y-4">
        <div className="flex items-center justify-between border-b border-background-border pb-3">
          <div>
            <h2
              id="recent-heading"
              className="font-serif text-2xl font-semibold text-white tracking-tight"
            >
              Recent Inscriptions
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              The latest artifacts deposited in the sanctuary
            </p>
          </div>
          <Link
            href="/archive"
            className="text-xs text-primary-light hover:underline focus-visible:ring-2 focus-visible:ring-primary rounded p-1"
          >
            View all ({allMemories.length}) &rarr;
          </Link>
        </div>

        {recentMemories.length === 0 ? (
          <EmptyState
            title="The Sanctuary Awaits"
            description="No memories have been inscribed into the archive yet. Provision development content or create new entries."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentMemories.map((memory) => (
              <MemoryCard key={memory.id} memory={memory} headingLevel="h3" />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
