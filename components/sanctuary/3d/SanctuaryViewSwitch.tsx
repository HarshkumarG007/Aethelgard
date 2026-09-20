"use client";

import React from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { MemorySummary } from "@/lib/data/memories";
import type { ChapterSummary } from "@/lib/data/chapters";
import { useSanctuary3DStore } from "./state/sanctuary3d.store";
import { WebGLErrorFallback } from "./WebGLErrorFallback";

// Dynamically load SanctuaryCanvas with SSR disabled to isolate WebGL from server rendering
const SanctuaryCanvas = dynamic(
  () => import("./SanctuaryCanvas").then((mod) => mod.SanctuaryCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[620px] rounded-2xl border border-background-border/80 bg-[#050811] flex flex-col items-center justify-center text-gray-400 gap-3 shadow-2xl">
        <span className="inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="font-mono text-xs tracking-wider uppercase text-gray-300">
          Initializing Spatial Sanctuary...
        </p>
      </div>
    ),
  }
);

interface SanctuaryViewSwitchProps {
  memories: MemorySummary[];
  chapters: ChapterSummary[];
  children: React.ReactNode;
}

export function SanctuaryViewSwitch({
  memories,
  children,
}: SanctuaryViewSwitchProps) {
  const {
    view,
    enter3D,
    exitTo2D,
    focusArtifact,
    escapeArtifact,
  } = useSanctuary3DStore();

  const is3DActive = view.state !== "2D";

  return (
    <div className="space-y-8">
      {/* View Switch Header Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl border border-background-border/80 bg-background-surface/50 backdrop-blur-md">
        <div>
          <h2 className="font-serif text-lg font-semibold text-white">
            {is3DActive ? "Spatial Sanctuary (Level II)" : "Sanctuary Viewpoint"}
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {is3DActive
              ? "Exploring procedural 3D sanctuary with synchronized semantic navigation"
              : "Browsing standard 2D Upper Archive"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {!is3DActive ? (
            <button
              type="button"
              onClick={enter3D}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/20 hover:bg-primary/30 border border-primary/40 text-primary-light text-xs font-semibold tracking-wider uppercase transition-all hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-primary shadow-lg"
            >
              <span className="text-base" aria-hidden="true">✦</span>
              <span>Enter 3D Sanctuary</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={exitTo2D}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-background-elevated hover:bg-background-surface border border-background-border text-gray-300 hover:text-white text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-primary"
            >
              <span>&larr;</span>
              <span>Return to 2D Archive</span>
            </button>
          )}
        </div>
      </div>

      {/* 3D Visual Experience (Mounted only on explicit opt-in) */}
      {is3DActive && (
        <section aria-labelledby="spatial-canvas-heading" className="space-y-4">
          <h2 id="spatial-canvas-heading" className="sr-only">
            3D Spatial Sanctuary Canvas
          </h2>

          {view.state === "3D_FALLBACK" ? (
            <WebGLErrorFallback
              errorMessage={view.errorMessage}
              circuitBreakerTripped={view.circuitBreakerTripped}
              onReturnTo2D={exitTo2D}
              onRetry={
                view.circuitBreakerTripped
                  ? undefined
                  : () => {
                      enter3D();
                    }
              }
            />
          ) : (
            <SanctuaryCanvas
              memories={memories}
              onExitTo2D={exitTo2D}
            />
          )}
        </section>
      )}

      {/* 
        MANDATORY ARCHITECTURAL REQUIREMENT 1:
        Independent Semantic DOM Navigation.
        - Rendered unconditionally from canonical authorized sanctuary data.
        - Exists whether 3D is active or not.
        - Never uses display:none, visibility:hidden, aria-hidden=true, inert, or pointer-events:none.
        - Links directly to canonical /memory/[id].
        - Tab, Enter, Escape work seamlessly.
      */}
      <nav
        aria-label="Spatial Memories Navigation"
        id="spatial-memories-nav"
        className="rounded-xl border border-background-border/70 bg-background-surface/40 p-5 backdrop-blur-sm"
      >
        <div className="flex items-center justify-between mb-4 border-b border-background-border/50 pb-3">
          <div>
            <h3 className="font-serif text-base font-semibold text-white tracking-tight">
              Spatial Directory &bull; Semantic Parity Index
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Direct accessible links to all {memories.length} sanctuary memories
            </p>
          </div>
          <span className="text-[11px] font-mono text-gray-400 bg-background-elevated px-2 py-0.5 rounded">
            Keyboard Nav: Tab / Enter / Esc
          </span>
        </div>

        {memories.length === 0 ? (
          <p className="text-xs text-gray-400 italic py-2">
            No memories currently in this sanctuary view.
          </p>
        ) : (
          <ul
            role="list"
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3"
          >
            {memories.map((m) => (
              <li key={m.id}>
                <Link
                  href={`/memory/${m.id}`}
                  onFocus={() => focusArtifact(m.id)}
                  onBlur={() => escapeArtifact()}
                  className="group block p-3 rounded-lg border border-background-border/60 bg-background-surface/60 hover:bg-background-elevated/70 hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary transition-all text-left"
                >
                  <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider mb-1">
                    <span className="text-primary-light/90">{m.kind}</span>
                    {m.emotion && (
                      <span className="text-gray-400 capitalize">{m.emotion}</span>
                    )}
                  </div>
                  <p className="font-serif text-sm font-medium text-white group-hover:text-primary-light transition-colors line-clamp-1">
                    {m.title}
                  </p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-background-border/30 text-[11px] text-gray-400">
                    <span>{m.memoryDate || "Undated"}</span>
                    {m.isFavorite && (
                      <span className="text-amber-400 text-xs" aria-label="Favorite">
                        ★
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </nav>

      {/* 2D Upper Archive Baseline (Full canonical sanctuary content) */}
      {!is3DActive && children}
    </div>
  );
}
