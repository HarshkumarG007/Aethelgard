import Link from "next/link";
import type { MemorySummary } from "@/lib/data/memories";

interface MemoryCardProps {
  memory: MemorySummary;
  headingLevel?: "h2" | "h3";
}

const KIND_STYLES: Record<string, { label: string; badge: string }> = {
  standard: {
    label: "Memory",
    badge: "border-sky-700/40 bg-sky-950/40 text-sky-300",
  },
  letter: {
    label: "Letter",
    badge: "border-amber-700/40 bg-amber-950/40 text-amber-300",
  },
  milestone: {
    label: "Milestone",
    badge: "border-purple-700/40 bg-purple-950/40 text-purple-300",
  },
  future: {
    label: "Promise",
    badge: "border-emerald-700/40 bg-emerald-950/40 text-emerald-300",
  },
};

const EMOTION_LABELS: Record<string, string> = {
  joy: "Joy",
  nostalgia: "Nostalgia",
  longing: "Longing",
  peace: "Peace",
  excitement: "Excitement",
  gratitude: "Gratitude",
  wonder: "Wonder",
};

export function MemoryCard({
  memory,
  headingLevel = "h2",
}: MemoryCardProps) {
  const kindInfo = KIND_STYLES[memory.kind] || KIND_STYLES.standard;
  const HeadingTag = headingLevel;

  const formattedDate = memory.memoryDate
    ? new Date(memory.memoryDate + "T00:00:00").toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <article
      className="group relative flex flex-col justify-between rounded-xl border border-background-border bg-background-surface/80 p-5 backdrop-blur-sm transition-all duration-200 hover:border-primary/50 hover:bg-background-elevated hover:shadow-lg focus-within:border-primary"
    >
      <div>
        {/* Top Badges: Kind, Emotion, Favorite */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded border text-[11px] font-medium tracking-wider uppercase ${kindInfo.badge}`}
            >
              {kindInfo.label}
            </span>
            {memory.emotion && (
              <span className="inline-flex items-center px-2 py-0.5 rounded bg-background-elevated border border-background-border text-[11px] text-gray-300">
                {EMOTION_LABELS[memory.emotion] || memory.emotion}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {memory.isFavorite && (
              <span
                className="text-amber-400 text-sm"
                aria-label="Favorite memory"
                title="Favorite memory"
              >
                ★
              </span>
            )}
            {formattedDate && (
              <time
                dateTime={memory.memoryDate || undefined}
                className="text-xs text-gray-400"
              >
                {formattedDate}
              </time>
            )}
          </div>
        </div>

        {/* Title */}
        <HeadingTag className="mt-3 font-serif text-lg font-semibold tracking-tight text-white group-hover:text-primary-light transition-colors">
          <Link
            href={`/memory/${memory.id}`}
            className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
          >
            <span className="absolute inset-0" aria-hidden="true" />
            {memory.title}
          </Link>
        </HeadingTag>

        {/* Description / Excerpt */}
        {memory.description && (
          <p className="mt-2 text-sm text-gray-300 line-clamp-3 leading-relaxed">
            {memory.description}
          </p>
        )}
      </div>

      {/* Footer metadata: Chapter, Location, Assets count */}
      <div className="mt-4 pt-3 border-t border-background-border/60 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-400">
        <div className="flex items-center gap-2">
          {memory.chapter && (
            <span className="inline-flex items-center gap-1 text-gray-400">
              <span className="w-1.5 h-1.5 rounded-full bg-primary/60" />
              {memory.chapter.title}
            </span>
          )}
          {memory.location?.name && (
            <span className="inline-flex items-center text-gray-400">
              📍 {memory.location.name}
            </span>
          )}
        </div>

        {memory.assets.length > 0 && (
          <span className="text-[11px] text-gray-400 bg-background-elevated px-2 py-0.5 rounded border border-background-border/50">
            {memory.assets.length} {memory.assets.length === 1 ? "artifact" : "artifacts"}
          </span>
        )}
      </div>
    </article>
  );
}
