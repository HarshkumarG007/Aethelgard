"use client";

import { useState } from "react";
import Link from "next/link";
import type { MemorySummary } from "@/lib/data/memories";
import { EmptyState } from "./EmptyState";

interface HorizonExperienceProps {
  promises: MemorySummary[];
}

export function HorizonExperience({ promises }: HorizonExperienceProps) {
  // Sealed state for interactive contemplation
  const [sealedMap, setSealedMap] = useState<Record<string, boolean>>({});

  function toggleSeal(id: string) {
    setSealedMap((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }

  return (
    <div className="space-y-12 pb-12">
      {/* Introduction Card */}
      <div className="rounded-2xl border border-emerald-900/40 bg-gradient-to-br from-[#0a1813] via-[#09110e] to-background-surface p-8 sm:p-10 shadow-xl text-center space-y-4">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-600/40 bg-emerald-950/40 text-emerald-300 text-xs font-mono tracking-widest uppercase">
          ✦ Toward Days Ahead
        </span>
        <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-emerald-100">
          Unwritten Pages & Future Promises
        </h2>
        <p className="max-w-xl mx-auto text-sm sm:text-base text-emerald-200/80 leading-relaxed font-sans">
          The sanctuary does not close in memory, but faces forward. These are the promises, uncompleted journeys, and days that remain to be lived.
        </p>
      </div>

      {/* Promises List */}
      {promises.length === 0 ? (
        <EmptyState
          title="The Horizon Awaits"
          description="No future promises or aspirations have been chartered yet. Inscribe commitments into the sanctuary."
        />
      ) : (
        <section aria-labelledby="promises-heading" className="space-y-6">
          <div className="flex items-center justify-between border-b border-background-border pb-3">
            <h2
              id="promises-heading"
              className="font-serif text-xl font-semibold text-emerald-200"
            >
              Committed Aspirations
            </h2>
            <span className="text-xs font-mono text-emerald-400">
              {promises.length} {promises.length === 1 ? "promise" : "promises"}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {promises.map((promise) => {
              const isSealed = Boolean(sealedMap[promise.id]);
              const formattedDate = promise.memoryDate
                ? new Date(promise.memoryDate + "T00:00:00").toLocaleDateString(
                    undefined,
                    {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    }
                  )
                : null;

              return (
                <article
                  key={promise.id}
                  className={`rounded-xl border p-6 backdrop-blur-sm transition-all duration-300 flex flex-col justify-between ${
                    isSealed
                      ? "border-emerald-500/70 bg-emerald-950/30 shadow-lg shadow-emerald-950/50"
                      : "border-background-border bg-background-surface/80 hover:border-emerald-700/50"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="inline-flex items-center px-2 py-0.5 rounded border border-emerald-800/50 bg-emerald-950/40 text-emerald-300 text-[10px] font-mono uppercase tracking-wider">
                        Future Commitment
                      </span>
                      {formattedDate && (
                        <span className="text-gray-400 font-mono text-xs">
                          Target: {formattedDate}
                        </span>
                      )}
                    </div>

                    <h3 className="font-serif text-lg font-semibold text-white">
                      <Link
                        href={`/memory/${promise.id}`}
                        className="hover:text-emerald-300 transition-colors focus-visible:ring-2 focus-visible:ring-primary rounded"
                      >
                        {promise.title}
                      </Link>
                    </h3>

                    {promise.description && (
                      <p className="text-sm text-gray-300 leading-relaxed">
                        {promise.description}
                      </p>
                    )}

                    {promise.bodyText && (
                      <div className="mt-3 p-3 rounded-lg bg-background-elevated/70 border border-emerald-950/60 text-xs text-emerald-100/90 italic font-serif leading-relaxed">
                        &ldquo;{promise.bodyText}&rdquo;
                      </div>
                    )}
                  </div>

                  {/* Affirmation / Contemplation Toggle */}
                  <div className="mt-6 pt-4 border-t border-background-border/50 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => toggleSeal(promise.id)}
                      aria-pressed={isSealed}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all focus-visible:ring-2 focus-visible:ring-primary ${
                        isSealed
                          ? "bg-emerald-900/60 border border-emerald-500 text-emerald-200"
                          : "bg-background-elevated border border-background-border text-gray-300 hover:text-white hover:border-emerald-600/50"
                      }`}
                    >
                      <span>{isSealed ? "✦ Sealed in Sanctuary" : "✧ Seal Promise"}</span>
                    </button>

                    <Link
                      href={`/memory/${promise.id}`}
                      className="text-xs text-gray-400 hover:text-emerald-300 font-medium"
                    >
                      Details &rarr;
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* Unwritten Pages Metaphor Box */}
      <div className="rounded-xl border border-dashed border-emerald-800/40 bg-background-surface/30 p-8 text-center space-y-3">
        <div className="text-emerald-400 text-2xl" aria-hidden="true">
          ❦
        </div>
        <h3 className="font-serif text-base font-semibold text-white">
          The Space That Remains
        </h3>
        <p className="max-w-md mx-auto text-xs text-gray-400 leading-relaxed">
          Not every memory has happened yet. The Sanctuary leaves room for tomorrow, for unwritten conversations, and for steps not yet taken.
        </p>
      </div>
    </div>
  );
}
