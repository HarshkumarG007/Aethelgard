import type { MemorySummary } from "@/lib/data/memories";
import type { ChapterSummary } from "@/lib/data/chapters";

/**
 * Artifact lifecycle state (independent of WebGL/View state)
 */
export type ArtifactState = "DORMANT" | "PROXIMATE" | "FOCUSED" | "ACTIVE";

/**
 * View/presentation lifecycle state (independent of individual artifact states)
 */
export type SpatialViewState =
  | "2D"
  | "3D_LOADING"
  | "3D_READY"
  | "3D_DEGRADED"
  | "3D_FALLBACK";

/**
 * Artifact machine events
 */
export type ArtifactEvent =
  | { type: "POINTER_ENTER"; id: string }
  | { type: "POINTER_LEAVE"; id: string }
  | { type: "FOCUS"; id: string }
  | { type: "ACTIVATE"; id: string }
  | { type: "ESCAPE" }
  | { type: "RESET" };

export type QualityTier = "TIER_3" | "TIER_2" | "TIER_1" | "EXHAUSTED";

export interface QualityContext {
  tier: QualityTier;
  dwellElapsedMs: number;
  targetDpr: number;
  moteCount: number;
  shaderProfile: "full" | "static" | "standard";
}

export type QualityEvent =
  | { type: "PERF_SAMPLE"; avgDeltaMs: number; elapsedMs: number }
  | { type: "STEP_DOWN" }
  | { type: "ATTEMPT_PROMOTION"; targetTier: QualityTier }
  | { type: "RESET" };

/**
 * View machine events
 */
export type ViewEvent =
  | { type: "ENTER_3D" }
  | { type: "SCENE_READY" }
  | { type: "WEBGL_UNAVAILABLE"; reason?: string }
  | { type: "CONTEXT_LOST" }
  | { type: "CONTEXT_RESTORED" }
  | { type: "RECOVERY_FAILED"; reason?: string }
  | { type: "QUALITY_EXHAUSTED" }
  | { type: "EXIT_TO_2D" }
  | { type: "RESET" };

export interface ArtifactContext {
  activeId: string | null;
  state: ArtifactState;
}

export interface ViewContext {
  state: SpatialViewState;
  lossCount: number;
  maxLosses: number; // 3
  circuitBreakerTripped: boolean;
  errorMessage: string | null;
}

/**
 * Safe domain projection for 3D presentation
 * Contains NO storageKey, NO signed URLs, NO credentials, NO raw DB rows
 */
export interface SpatialMemoryData {
  id: string;
  kind: "standard" | "letter" | "milestone" | "future";
  title: string;
  description: string | null;
  memoryDate: string | null;
  emotion: string | null;
  isFavorite: boolean;
  position: [number, number, number];
}

export interface Sanctuary3DProps {
  memories: MemorySummary[];
  chapters?: ChapterSummary[];
}
