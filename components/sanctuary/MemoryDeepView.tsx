"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MemorySummary } from "@/lib/data/memories";
import { MediaAssetViewer } from "./MediaAssetViewer";

interface MemoryDeepViewProps {
  memory: MemorySummary;
  prevId: string | null;
  nextId: string | null;
}

const EMOTIONS_TEXT: Record<string, { label: string; style: string }> = {
  joy: { label: "Joy", style: "border-amber-700/50 bg-amber-950/40 text-amber-200" },
  nostalgia: { label: "Nostalgia", style: "border-sky-700/50 bg-sky-950/40 text-sky-200" },
  longing: { label: "Longing", style: "border-indigo-700/50 bg-indigo-950/40 text-indigo-200" },
  peace: { label: "Peace", style: "border-teal-700/50 bg-teal-950/40 text-teal-200" },
  excitement: { label: "Excitement", style: "border-rose-700/50 bg-rose-950/40 text-rose-200" },
  gratitude: { label: "Gratitude", style: "border-emerald-700/50 bg-emerald-950/40 text-emerald-200" },
  wonder: { label: "Wonder", style: "border-purple-700/50 bg-purple-950/40 text-purple-200" },
};

export function MemoryDeepView({
  memory,
  prevId,
  nextId,
}: MemoryDeepViewProps) {
  const router = useRouter();

  // Keyboard navigation for deep view (ArrowLeft / ArrowRight / Escape)
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.ctrlKey || event.metaKey || event.altKey) return;

      const target = event.target as HTMLElement | null;
      const isTextInput =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;
      if (isTextInput) return;

      if (event.key === "Escape") {
        event.preventDefault();
        router.push("/archive");
      } else if (event.key === "ArrowLeft" && prevId) {
        event.preventDefault();
        router.push(`/memory/${prevId}`);
      } else if (event.key === "ArrowRight" && nextId) {
        event.preventDefault();
        router.push(`/memory/${nextId}`);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router, prevId, nextId]);

  const formattedDate = memory.memoryDate
    ? new Date(memory.memoryDate + "T00:00:00").toLocaleDateString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  const emotionInfo = memory.emotion ? EMOTIONS_TEXT[memory.emotion] : null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Top Navigation & Controls */}
      <nav
        aria-label="Memory Navigation"
        className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-background-border"
      >
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background-surface border border-background-border text-xs font-medium text-gray-300 hover:text-white hover:bg-background-elevated transition-colors focus-visible:ring-2 focus-visible:ring-primary"
        >
          <span aria-hidden="true">&larr;</span> Return
        </button>

        <div className="flex items-center gap-2">
          {prevId && (
            <Link
              href={`/memory/${prevId}`}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-background-surface border border-background-border text-xs text-gray-300 hover:text-white hover:bg-background-elevated transition-colors focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Previous chronological memory"
              title="Previous (Left Arrow)"
            >
              &larr; Earlier
            </Link>
          )}

          {nextId && (
            <Link
              href={`/memory/${nextId}`}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-background-surface border border-background-border text-xs text-gray-300 hover:text-white hover:bg-background-elevated transition-colors focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Next chronological memory"
              title="Next (Right Arrow)"
            >
              Later &rarr;
            </Link>
          )}
        </div>
      </nav>

      {/* Main Memory Article */}
      <article className="rounded-2xl border border-background-border bg-background-surface/80 p-6 sm:p-10 shadow-2xl backdrop-blur-md space-y-8">
        {/* Metadata Badges */}
        <header className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="uppercase text-[11px] font-mono tracking-wider px-2.5 py-0.5 rounded border border-primary/40 bg-primary/10 text-primary-light font-semibold">
                {memory.kind}
              </span>
              {emotionInfo && (
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded border text-[11px] font-medium ${emotionInfo.style}`}
                >
                  {emotionInfo.label}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {memory.isFavorite && (
                <span className="text-amber-400 text-sm" aria-label="Favorite">
                  ★ Treasured
                </span>
              )}
              {formattedDate && (
                <time
                  dateTime={memory.memoryDate || undefined}
                  className="font-mono text-gray-400 text-xs"
                >
                  {formattedDate}
                </time>
              )}
            </div>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-white leading-tight">
            {memory.title}
          </h1>

          {/* Context Line: Chapter & Location */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 pt-1">
            {memory.chapter && (
              <span className="inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                Inscribed in: <strong className="text-gray-300">{memory.chapter.title}</strong>
              </span>
            )}
            {memory.location?.name && (
              <span>📍 Geography: <strong className="text-gray-300">{memory.location.name}</strong></span>
            )}
          </div>
        </header>

        {/* Narrative / Reflection Story */}
        <section className="space-y-4 pt-4 border-t border-background-border/60">
          {memory.description && (
            <p className="text-lg text-gray-300 leading-relaxed font-sans italic">
              {memory.description}
            </p>
          )}

          {memory.bodyText && (
            <div className="prose prose-invert max-w-none text-gray-200 leading-relaxed whitespace-pre-line text-base font-sans pt-2">
              {memory.bodyText}
            </div>
          )}
        </section>

        {/* Media Assets Section */}
        {memory.assets.length > 0 && (
          <section
            aria-labelledby="assets-heading"
            className="pt-6 border-t border-background-border/60 space-y-4"
          >
            <h2
              id="assets-heading"
              className="font-serif text-xl font-medium text-white"
            >
              Deposited Artifacts ({memory.assets.length})
            </h2>
            <div className="space-y-4">
              {memory.assets.map((asset) => (
                <MediaAssetViewer key={asset.id} asset={asset} />
              ))}
            </div>
          </section>
        )}

        {/* Footer info */}
        <footer className="pt-6 border-t border-background-border/40 flex flex-wrap items-center justify-between text-xs text-gray-500 font-mono">
          <span>Artifact ID: {memory.id.slice(0, 8)}...</span>
          <span>Aethelgard Sanctuary Record</span>
        </footer>
      </article>
    </div>
  );
}
