import { cookies } from "next/headers";
import Link from "next/link";
import { AUTH_CONSTANTS } from "@/lib/auth/types";
import { validateSession } from "@/lib/auth/session";
import { getMemories, type MemorySummary } from "@/lib/data/memories";
import { EmptyState } from "@/components/sanctuary/EmptyState";

export const metadata = {
  title: "The Chronicle — Aethelgard Sanctuary",
  description: "Chronological journey traversing our relationship memories over time.",
};

const EMOTION_COLORS: Record<string, string> = {
  joy: "text-amber-300 border-amber-500/50 bg-amber-950/40",
  nostalgia: "text-sky-300 border-sky-500/50 bg-sky-950/40",
  longing: "text-indigo-300 border-indigo-500/50 bg-indigo-950/40",
  peace: "text-teal-300 border-teal-500/50 bg-teal-950/40",
  excitement: "text-rose-300 border-rose-500/50 bg-rose-950/40",
  gratitude: "text-emerald-300 border-emerald-500/50 bg-emerald-950/40",
  wonder: "text-purple-300 border-purple-500/50 bg-purple-950/40",
};

export default async function TimelinePage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(AUTH_CONSTANTS.SESSION_COOKIE_NAME);
  const validation = await validateSession(sessionCookie!.value);
  const user = validation.valid ? validation.user : null;

  if (!user) return null;

  const result = await getMemories(user, { limit: 100 });
  const memories = result.memories;

  // Group memories by Year
  const groupedByYear = new Map<string, MemorySummary[]>();
  for (const memory of memories) {
    const year = memory.memoryDate
      ? new Date(memory.memoryDate + "T00:00:00").getFullYear().toString()
      : "Undated";
    const existing = groupedByYear.get(year) || [];
    existing.push(memory);
    groupedByYear.set(year, existing);
  }

  const years = Array.from(groupedByYear.keys());

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-16">
      {/* Header */}
      <header className="text-center pt-2 pb-6 border-b border-background-border">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-sky-700/40 bg-sky-950/20 text-sky-300 text-xs tracking-widest uppercase mb-3">
          Chronological Journey
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight text-white">
          The Chronicle
        </h1>
        <p className="mt-2 text-sm sm:text-base text-gray-400 max-w-lg mx-auto">
          Traversing time across milestones, shared days, and quiet passages.
        </p>
      </header>

      {/* Year Jump Anchor Navigation */}
      {years.length > 1 && (
        <nav
          aria-label="Jump to timeline year"
          className="flex flex-wrap items-center justify-center gap-2 p-2 bg-background-surface/40 rounded-xl border border-background-border"
        >
          <span className="text-xs font-mono text-gray-400 mr-2">Timeline Periods:</span>
          {years.map((year) => (
            <a
              key={year}
              href={`#year-${year}`}
              className="px-3 py-1 rounded-lg bg-background-elevated border border-background-border text-xs font-mono text-gray-300 hover:text-white hover:border-primary/50 transition-colors focus-visible:ring-2 focus-visible:ring-primary"
            >
              {year} ({groupedByYear.get(year)?.length})
            </a>
          ))}
        </nav>
      )}

      {/* Timeline Content */}
      {memories.length === 0 ? (
        <EmptyState
          title="The Chronicle is Quiet"
          description="No memories have been charted onto the timeline yet. Populate development content to traverse the years."
        />
      ) : (
        <div className="space-y-16">
          {years.map((year) => {
            const yearMemories = groupedByYear.get(year) || [];

            return (
              <section
                key={year}
                id={`year-${year}`}
                aria-labelledby={`heading-year-${year}`}
                className="space-y-6 scroll-mt-24"
              >
                {/* Year Header Marker */}
                <div className="flex items-center gap-4">
                  <span className="h-px flex-1 bg-gradient-to-r from-transparent to-background-border" />
                  <h2
                    id={`heading-year-${year}`}
                    className="font-serif text-2xl font-bold tracking-wider text-primary-light px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 shadow-sm"
                  >
                    {year}
                  </h2>
                  <span className="h-px flex-1 bg-gradient-to-l from-transparent to-background-border" />
                </div>

                {/* Vertical Timeline Path */}
                <div className="relative pl-6 sm:pl-10 space-y-8 before:absolute before:left-2 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-primary/60 before:via-background-border before:to-primary/20">
                  {yearMemories.map((memory) => {
                    const formattedDate = memory.memoryDate
                      ? new Date(
                          memory.memoryDate + "T00:00:00"
                        ).toLocaleDateString(undefined, {
                          month: "long",
                          day: "numeric",
                        })
                      : "Undated";

                    const emotionStyle =
                      (memory.emotion && EMOTION_COLORS[memory.emotion]) ||
                      "text-gray-300 border-gray-700 bg-gray-900";

                    return (
                      <article
                        key={memory.id}
                        className="group relative rounded-xl border border-background-border bg-background-surface/80 p-5 backdrop-blur-sm transition-all duration-200 hover:border-primary/40 hover:bg-background-elevated focus-within:border-primary"
                      >
                        {/* Timeline node dot */}
                        <div
                          aria-hidden="true"
                          className="absolute -left-[29px] sm:-left-[37px] top-6 w-3 h-3 rounded-full bg-primary ring-4 ring-background-void group-hover:scale-125 transition-transform"
                        />

                        {/* Top row: Date, Emotion, Chapter */}
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2">
                            <time
                              dateTime={memory.memoryDate || undefined}
                              className="font-mono font-medium text-gray-400"
                            >
                              {formattedDate}
                            </time>
                            {memory.chapter && (
                              <span className="text-gray-500 font-sans">
                                &bull; {memory.chapter.title}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {memory.emotion && (
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-medium uppercase ${emotionStyle}`}
                              >
                                {memory.emotion}
                              </span>
                            )}
                            {memory.isFavorite && (
                              <span
                                className="text-amber-400 text-sm"
                                aria-label="Favorite memory"
                              >
                                ★
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Title */}
                        <h3 className="mt-2 font-serif text-lg font-semibold text-white group-hover:text-primary-light transition-colors">
                          <Link
                            href={`/memory/${memory.id}`}
                            className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                          >
                            <span
                              className="absolute inset-0"
                              aria-hidden="true"
                            />
                            {memory.title}
                          </Link>
                        </h3>

                        {/* Excerpt */}
                        {memory.description && (
                          <p className="mt-2 text-sm text-gray-300 leading-relaxed line-clamp-3">
                            {memory.description}
                          </p>
                        )}

                        {/* Footer metadata */}
                        <div className="mt-4 pt-3 border-t border-background-border/40 flex items-center justify-between text-xs text-gray-500">
                          <span>
                            {memory.location?.name ? `📍 ${memory.location.name}` : ""}
                          </span>
                          <span className="group-hover:text-primary-light transition-colors font-medium">
                            Read deep entry &rarr;
                          </span>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
