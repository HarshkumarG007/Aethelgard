import { describe, it, expect } from "vitest";
import {
  computeArchipelagoLayout,
  MIN_ISLAND_CENTER_DISTANCE,
  MIN_EDGE_CLEARANCE,
  MAX_SPATIAL_EXTENT,
} from "@/components/sanctuary/3d/islands/ArchipelagoLayout";
import type { ChapterSummary } from "@/lib/data/chapters";
import type { MemorySummary } from "@/lib/data/memories";

function mockChapter(id: string, sortOrder: number): ChapterSummary {
  return {
    id,
    title: `Chapter ${sortOrder}`,
    description: `Description ${sortOrder}`,
    sortOrder,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function mockMemory(id: string, chapterId: string | null, sortOrder: number): MemorySummary {
  return {
    id,
    kind: "standard",
    title: `Memory ${sortOrder}`,
    description: null,
    bodyText: null,
    memoryDate: "2024-01-01",
    location: null,
    emotion: "joy",
    threadKey: null,
    sortOrder,
    isFavorite: false,
    isDraft: false,
    chapter: chapterId ? { id: chapterId, title: `Chapter ${chapterId}` } : null,
    assets: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe("Phase 3B: Archipelago Layout Property Tests", () => {
  it("handles N = 0 chapters: creates single central well", () => {
    const layout = computeArchipelagoLayout([], []);
    expect(layout.islands).toHaveLength(1);
    expect(layout.islands[0].chapterId).toBe("central-well");
    expect(layout.islands[0].center).toEqual([0, 0, 0]);
  });

  it("handles N = 1 chapter: places single island at center", () => {
    const chapters = [mockChapter("ch-1", 0)];
    const layout = computeArchipelagoLayout(chapters, []);
    expect(layout.islands).toHaveLength(1);
    expect(layout.islands[0].chapterId).toBe("ch-1");
    expect(layout.islands[0].center).toEqual([0, 0, 0]);
  });

  const testCounts = [2, 3, 5, 7, 8, 15];

  testCounts.forEach((N) => {
    it(`guarantees minimum center distance >= 15.0 and |X,Z| <= 45 for N = ${N} chapters`, () => {
      const chapters = Array.from({ length: N }, (_, i) =>
        mockChapter(`ch-${i}`, i)
      );
      const layout = computeArchipelagoLayout(chapters, []);
      expect(layout.islands).toHaveLength(N);

      // Verify all islands satisfy spatial bounds |X| <= 45 and |Z| <= 45
      for (const isl of layout.islands) {
        expect(Math.abs(isl.center[0])).toBeLessThanOrEqual(MAX_SPATIAL_EXTENT);
        expect(Math.abs(isl.center[2])).toBeLessThanOrEqual(MAX_SPATIAL_EXTENT);
      }

      // Pairwise center distance check: dist(C_i, C_j) >= 15.0 for all i != j
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const ci = layout.islands[i].center;
          const cj = layout.islands[j].center;
          const dx = ci[0] - cj[0];
          const dz = ci[2] - cj[2];
          const dist = Math.sqrt(dx * dx + dz * dz);

          expect(
            dist,
            `Distance between island ${i} and island ${j} (${dist.toFixed(2)}) is less than ${MIN_ISLAND_CENTER_DISTANCE}`
          ).toBeGreaterThanOrEqual(MIN_ISLAND_CENTER_DISTANCE - 0.001);
        }
      }
    });
  });

  it("handles Canonical Benchmark dataset (8 chapters, 40 memories)", () => {
    const chapters = Array.from({ length: 8 }, (_, i) =>
      mockChapter(`ch-${i}`, i)
    );
    const memories = Array.from({ length: 40 }, (_, i) =>
      mockMemory(`mem-${i}`, `ch-${i % 8}`, i)
    );

    const layout = computeArchipelagoLayout(chapters, memories);
    expect(layout.islands).toHaveLength(8);
    expect(layout.memories).toHaveLength(40);

    for (const mem of layout.memories) {
      expect(Number.isFinite(mem.worldPosition[0])).toBe(true);
      expect(Number.isFinite(mem.worldPosition[1])).toBe(true);
      expect(Number.isFinite(mem.worldPosition[2])).toBe(true);
    }
  });

  it("handles Stress dataset (50 chapters, 500 memories) guaranteeing clearance >= 4.0 and bounds <= 45", () => {
    const chapters = Array.from({ length: 50 }, (_, i) =>
      mockChapter(`ch-${i}`, i)
    );
    const memories = Array.from({ length: 500 }, (_, i) =>
      mockMemory(`mem-${i}`, `ch-${i % 50}`, i)
    );

    const layout = computeArchipelagoLayout(chapters, memories);
    expect(layout.islands).toHaveLength(50);
    expect(layout.memories).toHaveLength(500);

    // Verify all 50 islands satisfy spatial bounds |X| <= 45 and |Z| <= 45
    for (const isl of layout.islands) {
      expect(Math.abs(isl.center[0])).toBeLessThanOrEqual(MAX_SPATIAL_EXTENT);
      expect(Math.abs(isl.center[2])).toBeLessThanOrEqual(MAX_SPATIAL_EXTENT);
    }

    // Pairwise clearance check: dist(C_i, C_j) - (R_i + R_j) >= 4.0
    for (let i = 0; i < 50; i++) {
      for (let j = i + 1; j < 50; j++) {
        const ci = layout.islands[i].center;
        const cj = layout.islands[j].center;
        const dx = ci[0] - cj[0];
        const dz = ci[2] - cj[2];
        const dist = Math.sqrt(dx * dx + dz * dz);
        const clearance = dist - (layout.islands[i].radius + layout.islands[j].radius);

        expect(
          clearance,
          `Clearance between island ${i} and island ${j} (${clearance.toFixed(2)}) is less than ${MIN_EDGE_CLEARANCE}`
        ).toBeGreaterThanOrEqual(MIN_EDGE_CLEARANCE - 0.001);
      }
    }

    for (const mem of layout.memories) {
      expect(Number.isNaN(mem.worldPosition[0])).toBe(false);
      expect(Number.isNaN(mem.worldPosition[2])).toBe(false);
    }
  });

  it("is strictly deterministic: identical inputs yield identical coordinates", () => {
    const chapters = Array.from({ length: 4 }, (_, i) =>
      mockChapter(`ch-${i}`, i)
    );
    const memories = Array.from({ length: 12 }, (_, i) =>
      mockMemory(`mem-${i}`, `ch-${i % 4}`, i)
    );

    const run1 = computeArchipelagoLayout(chapters, memories);
    const run2 = computeArchipelagoLayout(chapters, memories);

    expect(run1).toEqual(run2);
  });
});
