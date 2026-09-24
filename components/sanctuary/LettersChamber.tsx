"use client";

import { useState } from "react";
import Link from "next/link";
import type { MemorySummary } from "@/lib/data/memories";
import { EmptyState } from "./EmptyState";
import { VoiceRecorder } from "@/components/media/VoiceRecorder";

interface LettersChamberProps {
  letters: MemorySummary[];
}

export function LettersChamber({ letters }: LettersChamberProps) {
  const [selectedId, setSelectedId] = useState<string | null>(
    letters.length > 0 ? letters[0].id : null
  );
  const [useHandwritingFont, setUseHandwritingFont] = useState(true);

  if (letters.length === 0) {
    return (
      <div className="space-y-6">
        <VoiceRecorder />
        <EmptyState
          title="The Correspondence Chamber is Empty"
          description="No written letters or manuscripts have been sealed in this chamber yet."
        />
      </div>
    );
  }

  const selectedLetter = letters.find((l) => l.id === selectedId) || letters[0];

  const formattedDate = selectedLetter.memoryDate
    ? new Date(selectedLetter.memoryDate + "T00:00:00").toLocaleDateString(
        undefined,
        {
          year: "numeric",
          month: "long",
          day: "numeric",
        }
      )
    : "Undated";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Thread / Letter List (Sidebar on desktop) */}
      <aside
        aria-label="Letters Archive"
        className="lg:col-span-4 rounded-xl border border-amber-900/40 bg-background-surface/80 p-4 backdrop-blur-sm space-y-4"
      >
        <div className="flex items-center justify-between pb-3 border-b border-background-border">
          <h2 className="font-serif text-lg font-semibold text-amber-200">
            Manuscripts
          </h2>
          <span className="text-xs font-mono text-gray-400">
            {letters.length} {letters.length === 1 ? "letter" : "letters"}
          </span>
        </div>

        {/* Voice Memo Recorder */}
        <VoiceRecorder />

        <ul className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
          {letters.map((letter) => {
            const isSelected = letter.id === selectedLetter.id;
            const dateStr = letter.memoryDate
              ? new Date(
                  letter.memoryDate + "T00:00:00"
                ).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "Undated";

            return (
              <li key={letter.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(letter.id)}
                  aria-current={isSelected ? "true" : undefined}
                  className={`w-full text-left p-3 rounded-lg border transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary ${
                    isSelected
                      ? "bg-amber-950/40 border-amber-500/60 shadow-md"
                      : "bg-background-elevated/60 border-background-border/60 hover:bg-background-elevated hover:border-amber-900/50"
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] text-gray-400">
                    <span className="font-mono">{dateStr}</span>
                    {letter.isFavorite && (
                      <span className="text-amber-400 text-xs">★</span>
                    )}
                  </div>
                  <h3
                    className={`mt-1 font-serif text-sm font-medium ${
                      isSelected ? "text-amber-200 font-semibold" : "text-gray-200"
                    }`}
                  >
                    {letter.title}
                  </h3>
                  {letter.description && (
                    <p className="mt-1 text-xs text-gray-400 line-clamp-2">
                      {letter.description}
                    </p>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      {/* Main Manuscript Reader */}
      <section
        aria-labelledby="manuscript-title"
        className="lg:col-span-8 rounded-2xl border border-amber-900/50 bg-gradient-to-b from-[#141210] to-[#0c0b09] p-6 sm:p-10 shadow-2xl relative"
      >
        {/* Top Controls: Font Toggle & Detail Link */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-amber-950/80">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Typography:</span>
            <button
              type="button"
              onClick={() => setUseHandwritingFont((prev) => !prev)}
              aria-pressed={useHandwritingFont}
              className="px-3 py-1 rounded-lg border border-amber-900/50 bg-background-elevated text-xs font-medium text-amber-300 hover:text-white hover:bg-amber-950/40 transition-colors focus-visible:ring-2 focus-visible:ring-primary"
            >
              {useHandwritingFont ? "Handwriting (Caveat)" : "Clean (Sans-Serif)"}
            </button>
          </div>

          <Link
            href={`/memory/${selectedLetter.id}`}
            className="text-xs text-amber-400 hover:text-amber-300 underline font-medium focus-visible:ring-2 focus-visible:ring-primary rounded p-1"
          >
            Full Deep View &rarr;
          </Link>
        </div>

        {/* Manuscript Content */}
        <article className="mt-8 space-y-6">
          {/* Header */}
          <header className="space-y-2 text-center pb-6 border-b border-amber-950/60">
            <time
              dateTime={selectedLetter.memoryDate || undefined}
              className="font-mono text-xs text-amber-400/80 tracking-widest uppercase"
            >
              {formattedDate}
            </time>
            <h2
              id="manuscript-title"
              className="font-serif text-2xl sm:text-3xl font-semibold text-amber-100"
            >
              {selectedLetter.title}
            </h2>
            {selectedLetter.chapter && (
              <p className="text-xs text-gray-400">
                Inscribed within: {selectedLetter.chapter.title}
              </p>
            )}
          </header>

          {/* Letter Body Text */}
          <div
            className={`prose prose-invert max-w-none text-amber-50/90 leading-relaxed whitespace-pre-line text-lg ${
              useHandwritingFont
                ? "font-handwriting text-2xl tracking-wide leading-loose"
                : "font-sans text-base leading-relaxed"
            }`}
          >
            {selectedLetter.bodyText || selectedLetter.description || (
              <em className="text-gray-500 font-sans text-sm">
                No transcription provided for this manuscript.
              </em>
            )}
          </div>

          {/* Sealed Note / Sign-off Footer */}
          <footer className="pt-8 border-t border-amber-950/60 flex items-center justify-between text-xs text-amber-500/70">
            <span>Sealed in Sanctuary Memory</span>
            <span>✦ Aethelgard</span>
          </footer>
        </article>
      </section>
    </div>
  );
}
