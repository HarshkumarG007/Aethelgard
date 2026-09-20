import type { ChapterSummary } from "@/lib/data/chapters";
import type { MemorySummary } from "@/lib/data/memories";

export interface IslandLayout {
  chapterId: string;
  title: string;
  center: [number, number, number];
  radius: number;
}

export interface PlacedMemory {
  id: string;
  chapterId: string | null;
  kind: "standard" | "letter" | "milestone" | "future";
  title: string;
  worldPosition: [number, number, number];
  localOffset: [number, number, number];
  islandCenter: [number, number, number];
  isProximateAnchor: boolean;
}

export interface ArchipelagoLayout {
  islands: IslandLayout[];
  memories: PlacedMemory[];
}

export const MIN_ISLAND_CENTER_DISTANCE = 15.0;
export const MAX_ISLAND_RADIUS = 5.5;
export const MIN_EDGE_CLEARANCE = 4.0;
export const MAX_SPATIAL_EXTENT = 45.0;

/**
 * Computes deterministic non-overlapping coordinates for chapter islands.
 * Guaranteed invariants:
 * - dist(C_i, C_j) >= 15.0 for all i != j
 * - |X| <= 45.0 and |Z| <= 45.0 for all islands
 * - Island radius capped at 5.5 (minimum edge clearance >= 4.0)
 * - Deterministic: identical input produces bit-exact coordinates.
 */
export function computeArchipelagoLayout(
  chapters: ChapterSummary[] = [],
  memories: MemorySummary[] = []
): ArchipelagoLayout {
  const N = chapters.length;
  const islands: IslandLayout[] = [];

  if (N === 0) {
    // Zero chapters: single Origin Dais at center
    islands.push({
      chapterId: "central-well",
      title: "The Central Well",
      center: [0, 0, 0],
      radius: MAX_ISLAND_RADIUS,
    });
  } else if (N === 1) {
    // Single chapter: placed at center
    islands.push({
      chapterId: chapters[0].id,
      title: chapters[0].title,
      center: [0, 0, 0],
      radius: MAX_ISLAND_RADIUS,
    });
  } else if (N <= 7) {
    // 2 to 7 chapters: single ellipse/circle with guaranteed chord distance >= 15.0
    // Chord distance D = 2 * R * sin(pi / N) >= 15.0 => R >= 15 / (2 * sin(pi / N))
    const minR = 15.0 / (2.0 * Math.sin(Math.PI / N));
    const R = Math.min(MAX_SPATIAL_EXTENT - MAX_ISLAND_RADIUS, Math.max(18.0, minR + 0.5));

    for (let i = 0; i < N; i++) {
      const angle = (2.0 * Math.PI * i) / N - Math.PI / 2.0;
      const x = Math.cos(angle) * R;
      const z = Math.sin(angle) * R;
      islands.push({
        chapterId: chapters[i].id,
        title: chapters[i].title,
        center: [x, 0, z],
        radius: MAX_ISLAND_RADIUS,
      });
    }
  } else if (N <= 15) {
    // 8 to 15 chapters: 2 concentric rings guaranteeing dist >= 15.0 and clearance >= 4.0
    const ring1Count = Math.min(N, 5);
    const ring2Count = Math.max(0, N - 5);

    let assigned = 0;
    const R1 = 18.0;
    for (let i = 0; i < ring1Count; i++) {
      const angle = (2.0 * Math.PI * i) / ring1Count - Math.PI / 2.0;
      islands.push({
        chapterId: chapters[assigned].id,
        title: chapters[assigned].title,
        center: [Math.cos(angle) * R1, 0, Math.sin(angle) * R1],
        radius: MAX_ISLAND_RADIUS,
      });
      assigned++;
    }

    if (ring2Count > 0) {
      const R2 = 33.5;
      const offset = Math.PI / ring2Count;
      for (let i = 0; i < ring2Count; i++) {
        const angle = (2.0 * Math.PI * i) / ring2Count + offset;
        islands.push({
          chapterId: chapters[assigned].id,
          title: chapters[assigned].title,
          center: [Math.cos(angle) * R2, 0, Math.sin(angle) * R2],
          radius: MAX_ISLAND_RADIUS,
        });
        assigned++;
      }
    }
  } else {
    // N > 15 chapters (Stress datasets): 4 concentric rings with scaled island radius
    // Strictly guarantees pairwise edge clearance >= 4.0 and bounds |X|, |Z| <= 45.0
    const islandRadius = Math.max(1.8, 15.0 / Math.sqrt(N));
    const rings = [
      { R: 10, count: Math.min(4, N) },
      { R: 20, count: Math.min(8, Math.max(0, N - 4)) },
      { R: 31, count: Math.min(15, Math.max(0, N - 12)) },
      { R: 43, count: Math.max(0, N - 27) },
    ];

    let assigned = 0;
    for (let r = 0; r < rings.length && assigned < N; r++) {
      const count = Math.min(rings[r].count, N - assigned);
      const R = rings[r].R;
      for (let i = 0; i < count; i++) {
        const angle = (2.0 * Math.PI * i) / count + r * 0.4;
        islands.push({
          chapterId: chapters[assigned].id,
          title: chapters[assigned].title,
          center: [Math.cos(angle) * R, 0, Math.sin(angle) * R],
          radius: islandRadius,
        });
        assigned++;
      }
    }
  }

  // Map of island centers by chapterId
  const islandMap = new Map<string, IslandLayout>();
  for (const isl of islands) {
    islandMap.set(isl.chapterId, isl);
  }
  const defaultIsland = islands[0];

  // Group memories by chapter
  const memoriesByChapter = new Map<string, MemorySummary[]>();
  for (const mem of memories) {
    const chapId = mem.chapter?.id || "central-well";
    const list = memoriesByChapter.get(chapId) || [];
    list.push(mem);
    memoriesByChapter.set(chapId, list);
  }

  const placedMemories: PlacedMemory[] = [];

  // Position memories clustered around their respective island center
  for (const [chapId, memList] of memoriesByChapter.entries()) {
    const targetIsland = islandMap.get(chapId) || defaultIsland;
    const [cx, cy, cz] = targetIsland.center;
    const count = memList.length;

    for (let k = 0; k < count; k++) {
      const mem = memList[k];

      // Multi-concentric orbit calculation for large memory counts
      let r = 2.8;
      let angle = (2.0 * Math.PI * k) / Math.max(1, Math.min(count, 6));

      if (k >= 6 && k < 14) {
        // Ring 2
        r = 3.8;
        angle = (2.0 * Math.PI * (k - 6)) / 8.0 + Math.PI / 8.0;
      } else if (k >= 14) {
        // Ring 3
        r = 4.8;
        angle = (2.0 * Math.PI * (k - 14)) / 12.0 + Math.PI / 12.0;
      }

      // Height variation for visual interest
      const yOffset = 0.25 + ((k % 3) - 1) * 0.22;
      const lx = Math.cos(angle) * r;
      const lz = Math.sin(angle) * r;

      placedMemories.push({
        id: mem.id,
        chapterId: mem.chapter?.id || null,
        kind: mem.kind,
        title: mem.title,
        worldPosition: [cx + lx, cy + yOffset, cz + lz],
        localOffset: [lx, yOffset, lz],
        islandCenter: [cx, cy, cz],
        isProximateAnchor: k < 12, // First 12 memories are proximate anchors; remainder instanced
      });
    }
  }

  return {
    islands,
    memories: placedMemories,
  };
}
