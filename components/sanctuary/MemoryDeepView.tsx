"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MemorySummary } from "@/lib/data/memories";
import { MediaAssetViewer } from "./MediaAssetViewer";
import { MemoryComposerModal } from "@/components/admin/MemoryComposerModal";

interface MemoryDeepViewProps {
  memory: MemorySummary;
  prevId: string | null;
  nextId: string | null;
  isAdmin?: boolean;
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
  isAdmin = false,
}: MemoryDeepViewProps) {
  const router = useRouter();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/admin/memories/${memory.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error?.message || "Failed to remove artifact from chronicle");
      }

      // Successfully soft-deleted; return to the Archive
      setShowDeleteConfirm(false);
      router.push("/archive");
      router.refresh();
    } catch (err: unknown) {
      setDeleteError((err as Error).message || "An unexpected error occurred during removal");
      setIsDeleting(false);
    }
  };

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

        <div className="flex items-center gap-3">
          {isAdmin && (
            <div className="flex items-center gap-2 border-r border-background-border/70 pr-3">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/40 text-xs font-medium text-primary-light hover:bg-primary/20 hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-primary"
                title="Edit and refine memory contents"
              >
                <span>✎</span> Refine
              </button>
              <button
                type="button"
                onClick={() => {
                  setDeleteError(null);
                  setShowDeleteConfirm(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/20 border border-rose-900/40 text-xs font-medium text-rose-300 hover:bg-rose-900/40 hover:text-rose-100 transition-colors focus-visible:ring-2 focus-visible:ring-rose-500"
                title="Remove memory from active chronicle"
              >
                <span>✕</span> Remove
              </button>
            </div>
          )}

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

      {/* Edit Memory Modal */}
      {isAdmin && (
        <MemoryComposerModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          initialData={memory}
          onSuccess={() => router.refresh()}
        />
      )}

      {/* Delete Confirmation Modal */}
      {isAdmin && showDeleteConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background-void/80 backdrop-blur-md animate-fade-in"
        >
          <div className="relative w-full max-w-md rounded-2xl border border-rose-900/40 bg-background-surface p-6 shadow-2xl space-y-5">
            <div className="space-y-2">
              <span className="inline-block text-rose-400 text-xs font-mono uppercase tracking-widest font-semibold">
                Sanctuary Chronicle Action
              </span>
              <h3
                id="delete-dialog-title"
                className="font-serif text-xl font-semibold text-white"
              >
                Archive Memory Artifact?
              </h3>
              <p className="text-sm text-gray-300 leading-relaxed">
                Are you sure you wish to remove <strong className="text-white">&ldquo;{memory.title}&rdquo;</strong> from the active sanctuary? This record and associated assets will be sealed away from the living chronicle.
              </p>
            </div>

            {deleteError && (
              <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800 text-xs text-rose-300">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg bg-background-surface border border-background-border text-xs font-medium text-gray-300 hover:text-white hover:bg-background-elevated transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs font-medium text-white transition-colors disabled:opacity-50 shadow-lg shadow-rose-950/50"
              >
                {isDeleting ? (
                  <>
                    <span className="inline-block w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Archiving...
                  </>
                ) : (
                  "Confirm Removal"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
