import type { PlacedMemory } from "../islands/ArchipelagoLayout";
import type { MemorySummary } from "@/lib/data/memories";
import type { SpatialMemoryData } from "./sanctuary3d.types";

export const RENDER_VOLUME_RADIUS = 50.0;
export const RENDER_VOLUME_RADIUS_SQ = RENDER_VOLUME_RADIUS * RENDER_VOLUME_RADIUS;
export const MAX_PROXIMATE_COUNT = 5;

export type MemoryRenderPartitionCategory =
  | "FOCUSED"
  | "PROXIMATE"
  | "DISTANT"
  | "OUTSIDE_RENDER_VOLUME";

export interface MemoryPartitionResult {
  focusedData: SpatialMemoryData | null;
  proximateData: SpatialMemoryData[];
  distantData: SpatialMemoryData[];
  outsideVolumeData: SpatialMemoryData[];
  partitionMap: Map<string, MemoryRenderPartitionCategory>;
}

/**
 * Pure, deterministic partitioning function for Sanctuary memories.
 *
 * FORMAL INVARIANTS:
 * 1. Mutual Exclusion: Every memory belongs to EXACTLY ONE partition:
 *    FOCUSED ∩ PROXIMATE = ∅
 *    FOCUSED ∩ DISTANT = ∅
 *    PROXIMATE ∩ DISTANT = ∅
 *    OUTSIDE_RENDER_VOLUME ∩ (FOCUSED ∪ PROXIMATE ∪ DISTANT) = ∅
 * 2. Completeness:
 *    |FOCUSED| + |PROXIMATE| + |DISTANT| + |OUTSIDE_RENDER_VOLUME| === |layoutMemories|
 * 3. GPU Payload Exclusion:
 *    OUTSIDE_RENDER_VOLUME is strictly excluded from all GPU-facing render sets
 *    (focusedData, proximateData, distantData).
 */
export function partitionSceneMemories(
  layoutMemories: PlacedMemory[],
  memoryLookup: Map<string, MemorySummary>,
  activeId: string | null,
  renderRadiusSq: number = RENDER_VOLUME_RADIUS_SQ
): MemoryPartitionResult {
  let focusedData: SpatialMemoryData | null = null;
  const proximateData: SpatialMemoryData[] = [];
  const distantData: SpatialMemoryData[] = [];
  const outsideVolumeData: SpatialMemoryData[] = [];
  const partitionMap = new Map<string, MemoryRenderPartitionCategory>();

  // Determine active chapter if activeId is present
  const activeItem = activeId
    ? layoutMemories.find((m) => m.id === activeId)
    : null;
  const activeChapterId = activeItem?.chapterId ?? null;

  for (const item of layoutMemories) {
    const spatialData: SpatialMemoryData = {
      id: item.id,
      chapterId: item.chapterId ?? undefined,
      kind: item.kind,
      position: item.worldPosition,
    };

    const distSq =
      item.worldPosition[0] * item.worldPosition[0] +
      item.worldPosition[2] * item.worldPosition[2];

    // Priority 1: Volume culling (|X|^2 + |Z|^2 > 50^2)
    if (distSq > renderRadiusSq) {
      outsideVolumeData.push(spatialData);
      partitionMap.set(item.id, "OUTSIDE_RENDER_VOLUME");
      continue;
    }

    // Priority 2: Focused memory (at most 1)
    if (activeId && item.id === activeId) {
      focusedData = spatialData;
      partitionMap.set(item.id, "FOCUSED");
      continue;
    }

    // Priority 3: Proximate memories (same chapter as focused, capped at MAX_PROXIMATE_COUNT)
    if (
      activeChapterId !== null &&
      item.chapterId === activeChapterId &&
      proximateData.length < MAX_PROXIMATE_COUNT
    ) {
      proximateData.push(spatialData);
      partitionMap.set(item.id, "PROXIMATE");
      continue;
    }

    // Priority 4: Distant instanced batch
    distantData.push(spatialData);
    partitionMap.set(item.id, "DISTANT");
  }

  return {
    focusedData,
    proximateData,
    distantData,
    outsideVolumeData,
    partitionMap,
  };
}
