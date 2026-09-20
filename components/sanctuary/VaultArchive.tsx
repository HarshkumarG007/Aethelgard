"use client";

import { useState, useMemo } from "react";
import type { MemorySummary } from "@/lib/data/memories";
import type { ChapterSummary } from "@/lib/data/chapters";
import { MemoryCard } from "./MemoryCard";
import { EmptyState } from "./EmptyState";

interface VaultArchiveProps {
  initialMemories: MemorySummary[];
  chapters: ChapterSummary[];
}

export function VaultArchive({
  initialMemories,
  chapters,
}: VaultArchiveProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChapter, setSelectedChapter] = useState<string>("all");
  const [selectedKind, setSelectedKind] = useState<string>("all");
  const [selectedEmotion, setSelectedEmotion] = useState<string>("all");
  const [onlyFavorites, setOnlyFavorites] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<"date-desc" | "date-asc" | "title">("date-desc");

  // Client-side instant filter over fetched memories
  const filteredMemories = useMemo(() => {
    return initialMemories
      .filter((memory) => {
        // Query filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const titleMatch = memory.title.toLowerCase().includes(q);
          const descMatch = memory.description?.toLowerCase().includes(q) ?? false;
          const bodyMatch = memory.bodyText?.toLowerCase().includes(q) ?? false;
          const locationMatch = memory.location?.name?.toLowerCase().includes(q) ?? false;
          if (!titleMatch && !descMatch && !bodyMatch && !locationMatch) {
            return false;
          }
        }

        // Chapter filter
        if (selectedChapter !== "all" && memory.chapter?.id !== selectedChapter) {
          return false;
        }

        // Kind filter
        if (selectedKind !== "all" && memory.kind !== selectedKind) {
          return false;
        }

        // Emotion filter
        if (selectedEmotion !== "all" && memory.emotion !== selectedEmotion) {
          return false;
        }

        // Favorites filter
        if (onlyFavorites && !memory.isFavorite) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "title") {
          return a.title.localeCompare(b.title);
        }
        const dateA = a.memoryDate || "0000-00-00";
        const dateB = b.memoryDate || "0000-00-00";
        if (sortBy === "date-asc") {
          return dateA.localeCompare(dateB);
        }
        return dateB.localeCompare(dateA);
      });
  }, [
    initialMemories,
    searchQuery,
    selectedChapter,
    selectedKind,
    selectedEmotion,
    onlyFavorites,
    sortBy,
  ]);

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    selectedChapter !== "all" ||
    selectedKind !== "all" ||
    selectedEmotion !== "all" ||
    onlyFavorites;

  function handleResetFilters() {
    setSearchQuery("");
    setSelectedChapter("all");
    setSelectedKind("all");
    setSelectedEmotion("all");
    setOnlyFavorites(false);
  }

  return (
    <div className="space-y-8">
      {/* Search & Filter Controls */}
      <section
        aria-label="Archive Search and Filters"
        className="rounded-2xl border border-background-border bg-background-surface/80 p-6 backdrop-blur-sm space-y-5"
      >
        {/* Search input (strictly bounded to max 100 characters per contract) */}
        <div>
          <label
            htmlFor="archive-search"
            className="block text-xs font-medium text-gray-300 uppercase tracking-wider mb-1.5"
          >
            Search Memories
          </label>
          <div className="relative">
            <input
              id="archive-search"
              type="search"
              maxLength={100}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, reflection, or location..."
              className="w-full rounded-xl border border-background-border bg-background-void px-4 py-2.5 text-sm text-white placeholder-gray-500 transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-white"
                aria-label="Clear search input"
              >
                ✕
              </button>
            )}
          </div>
          <span className="text-[11px] text-gray-500 mt-1 block">
            Query limited to 100 characters max.
          </span>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-background-border/50">
          {/* Chapter Filter */}
          <div>
            <label
              htmlFor="chapter-filter"
              className="block text-xs text-gray-400 mb-1"
            >
              Chapter
            </label>
            <select
              id="chapter-filter"
              value={selectedChapter}
              onChange={(e) => setSelectedChapter(e.target.value)}
              className="w-full rounded-lg border border-background-border bg-background-void px-3 py-1.5 text-xs text-gray-200 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">All Chapters</option>
              {chapters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          {/* Kind Filter */}
          <div>
            <label
              htmlFor="kind-filter"
              className="block text-xs text-gray-400 mb-1"
            >
              Artifact Kind
            </label>
            <select
              id="kind-filter"
              value={selectedKind}
              onChange={(e) => setSelectedKind(e.target.value)}
              className="w-full rounded-lg border border-background-border bg-background-void px-3 py-1.5 text-xs text-gray-200 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">All Kinds</option>
              <option value="standard">Standard Memory</option>
              <option value="letter">Letter</option>
              <option value="milestone">Milestone</option>
              <option value="future">Promise</option>
            </select>
          </div>

          {/* Emotion Filter */}
          <div>
            <label
              htmlFor="emotion-filter"
              className="block text-xs text-gray-400 mb-1"
            >
              Emotion
            </label>
            <select
              id="emotion-filter"
              value={selectedEmotion}
              onChange={(e) => setSelectedEmotion(e.target.value)}
              className="w-full rounded-lg border border-background-border bg-background-void px-3 py-1.5 text-xs text-gray-200 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">All Emotions</option>
              <option value="joy">Joy</option>
              <option value="nostalgia">Nostalgia</option>
              <option value="longing">Longing</option>
              <option value="peace">Peace</option>
              <option value="excitement">Excitement</option>
              <option value="gratitude">Gratitude</option>
              <option value="wonder">Wonder</option>
            </select>
          </div>

          {/* Sort Order */}
          <div>
            <label
              htmlFor="sort-filter"
              className="block text-xs text-gray-400 mb-1"
            >
              Ordering
            </label>
            <select
              id="sort-filter"
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as "date-desc" | "date-asc" | "title")
              }
              className="w-full rounded-lg border border-background-border bg-background-void px-3 py-1.5 text-xs text-gray-200 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="date-desc">Newest Date First</option>
              <option value="date-asc">Oldest Date First</option>
              <option value="title">Alphabetical (Title)</option>
            </select>
          </div>
        </div>

        {/* Toggles & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-background-border/50">
          <label className="inline-flex items-center gap-2 cursor-pointer text-xs text-gray-300">
            <input
              type="checkbox"
              checked={onlyFavorites}
              onChange={(e) => setOnlyFavorites(e.target.checked)}
              className="rounded border-background-border bg-background-void text-primary focus:ring-primary"
            />
            <span>Favorites only (★)</span>
          </label>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs text-primary-light hover:underline focus-visible:ring-2 focus-visible:ring-primary rounded p-1"
            >
              Reset all filters
            </button>
          )}
        </div>
      </section>

      {/* Results Header with Accessible Live Region */}
      <div className="flex items-center justify-between">
        <div
          aria-live="polite"
          aria-atomic="true"
          className="text-xs font-mono text-gray-400"
        >
          Showing {filteredMemories.length} of {initialMemories.length} memories
          {hasActiveFilters ? " (filtered)" : ""}
        </div>
      </div>

      {/* Grid of Results */}
      {filteredMemories.length === 0 ? (
        <EmptyState
          title="No Artifacts Match Your Query"
          description="Try broadening your search terms or clearing the selected filters to reveal memories."
          actionLabel={hasActiveFilters ? "Reset Filters" : undefined}
          onAction={hasActiveFilters ? handleResetFilters : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMemories.map((memory) => (
            <MemoryCard key={memory.id} memory={memory} headingLevel="h2" />
          ))}
        </div>
      )}
    </div>
  );
}
