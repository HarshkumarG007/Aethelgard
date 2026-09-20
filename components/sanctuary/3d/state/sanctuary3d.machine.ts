import type {
  ArtifactContext,
  ArtifactEvent,
  QualityContext,
  QualityEvent,
  QualityTier,
  ViewContext,
  ViewEvent,
} from "./sanctuary3d.types";

export const INITIAL_ARTIFACT_CONTEXT: Readonly<ArtifactContext> = Object.freeze({
  activeId: null,
  state: "DORMANT",
});

export const INITIAL_VIEW_CONTEXT: Readonly<ViewContext> = Object.freeze({
  state: "2D",
  lossCount: 0,
  maxLosses: 3,
  circuitBreakerTripped: false,
  errorMessage: null,
});

export const QUALITY_PROFILES: Record<
  QualityTier,
  { targetDpr: number; moteCount: number; shaderProfile: "full" | "static" | "standard" }
> = {
  TIER_3: { targetDpr: 1.5, moteCount: 300, shaderProfile: "full" },
  TIER_2: { targetDpr: 1.0, moteCount: 120, shaderProfile: "static" },
  TIER_1: { targetDpr: 0.75, moteCount: 0, shaderProfile: "standard" },
  EXHAUSTED: { targetDpr: 0.0, moteCount: 0, shaderProfile: "standard" },
};

export const TIER_THRESHOLDS_MS: Record<Exclude<QualityTier, "EXHAUSTED">, number> = {
  TIER_3: 33.33,
  TIER_2: 33.33,
  TIER_1: 50.0,
};

export const DWELL_DURATION_MS = 3000;

export const INITIAL_QUALITY_CONTEXT: Readonly<QualityContext> = Object.freeze({
  tier: "TIER_3",
  dwellElapsedMs: 0,
  targetDpr: QUALITY_PROFILES.TIER_3.targetDpr,
  moteCount: QUALITY_PROFILES.TIER_3.moteCount,
  shaderProfile: QUALITY_PROFILES.TIER_3.shaderProfile,
});

/**
 * Pure artifact state machine:
 * DORMANT <-> PROXIMATE <-> FOCUSED -> ACTIVE
 *
 * Guaranteed Invariants:
 * - Pure function: no side-effects, no browser/DOM references, no async logic.
 * - Direct transition from DORMANT to ACTIVE is illegal and rejected.
 * - Direct transition from PROXIMATE to ACTIVE is illegal and rejected.
 * - POINTER_LEAVE for an artifact other than the active one is rejected.
 * - In FOCUSED state, POINTER_LEAVE is ignored (keyboard/DOM focus dominates over hover).
 * - ESCAPE from ACTIVE returns to FOCUSED.
 * - ESCAPE from FOCUSED returns to DORMANT.
 * - Repeated ESCAPE in DORMANT remains DORMANT (idempotent).
 * - RESET returns to DORMANT with null activeId.
 */
export function transitionArtifact(
  current: ArtifactContext,
  event: ArtifactEvent
): ArtifactContext {
  switch (current.state) {
    case "DORMANT": {
      if (event.type === "POINTER_ENTER") {
        return { state: "PROXIMATE", activeId: event.id };
      }
      if (event.type === "FOCUS") {
        return { state: "FOCUSED", activeId: event.id };
      }
      // Illegal transitions from DORMANT
      if (event.type === "ACTIVATE" || event.type === "POINTER_LEAVE") {
        return current;
      }
      if (event.type === "ESCAPE" || event.type === "RESET") {
        return { state: "DORMANT", activeId: null };
      }
      return current;
    }

    case "PROXIMATE": {
      if (event.type === "POINTER_LEAVE") {
        // Only return to DORMANT if leaving the currently proximate artifact
        if (event.id === current.activeId) {
          return { state: "DORMANT", activeId: null };
        }
        return current;
      }
      if (event.type === "POINTER_ENTER") {
        return { state: "PROXIMATE", activeId: event.id };
      }
      if (event.type === "FOCUS") {
        return { state: "FOCUSED", activeId: event.id };
      }
      if (event.type === "ESCAPE" || event.type === "RESET") {
        return { state: "DORMANT", activeId: null };
      }
      // Direct ACTIVATE from PROXIMATE is illegal (must be FOCUSED first)
      if (event.type === "ACTIVATE") {
        return current;
      }
      return current;
    }

    case "FOCUSED": {
      if (event.type === "ACTIVATE") {
        if (event.id === current.activeId) {
          return { state: "ACTIVE", activeId: event.id };
        }
        return current;
      }
      if (event.type === "FOCUS") {
        return { state: "FOCUSED", activeId: event.id };
      }
      if (event.type === "ESCAPE" || event.type === "RESET") {
        return { state: "DORMANT", activeId: null };
      }
      // Focus dominates over pointer hover leaves/enters
      if (event.type === "POINTER_LEAVE" || event.type === "POINTER_ENTER") {
        return current;
      }
      return current;
    }

    case "ACTIVE": {
      if (event.type === "ESCAPE") {
        // Step down from ACTIVE to FOCUSED
        return { state: "FOCUSED", activeId: current.activeId };
      }
      if (event.type === "RESET") {
        return { state: "DORMANT", activeId: null };
      }
      if (event.type === "FOCUS") {
        return { state: "FOCUSED", activeId: event.id };
      }
      // Redundant or illegal in ACTIVE
      if (
        event.type === "ACTIVATE" ||
        event.type === "POINTER_ENTER" ||
        event.type === "POINTER_LEAVE"
      ) {
        return current;
      }
      return current;
    }

    default:
      return current;
  }
}

/**
 * Pure Spatial View State Machine:
 * 2D -> 3D_LOADING -> 3D_READY
 *                  -> 3D_FALLBACK
 * 3D_READY -> CONTEXT_LOST (1st) -> 3D_DEGRADED -> RESTORED -> 3D_READY
 *                                                -> FAILED -> 3D_FALLBACK
 *          -> CONTEXT_LOST (2nd) -> 3D_DEGRADED -> RESTORED -> 3D_READY
 *                                                -> FAILED -> 3D_FALLBACK
 *          -> CONTEXT_LOST (3rd) -> 3D_FALLBACK (Circuit breaker tripped)
 *
 * Guaranteed Invariants:
 * - Pure function: no WebGL calls, no window listeners, deterministic.
 * - Circuit breaker trips after 3 context losses, disabling 3D for the session.
 * - WebGL context loss is separated from artifact states.
 * - Infinite recovery loops are strictly prevented.
 */
export function transitionView(
  current: ViewContext,
  event: ViewEvent
): ViewContext {
  switch (event.type) {
    case "ENTER_3D": {
      if (current.circuitBreakerTripped) {
        return {
          ...current,
          state: "3D_FALLBACK",
          errorMessage:
            "3D sanctuary is disabled for this session due to repeated graphics context crashes.",
        };
      }
      if (current.state === "2D" || current.state === "3D_FALLBACK") {
        return {
          ...current,
          state: "3D_LOADING",
          errorMessage: null,
        };
      }
      return current;
    }

    case "SCENE_READY": {
      if (current.state === "3D_LOADING" || current.state === "3D_DEGRADED") {
        return {
          ...current,
          state: "3D_READY",
          errorMessage: null,
        };
      }
      return current;
    }

    case "WEBGL_UNAVAILABLE": {
      return {
        ...current,
        state: "3D_FALLBACK",
        errorMessage:
          event.reason || "Hardware acceleration or WebGL 2.0 is unavailable on this device.",
      };
    }

    case "CONTEXT_LOST": {
      const nextLossCount = current.lossCount + 1;
      if (nextLossCount >= current.maxLosses) {
        return {
          ...current,
          state: "3D_FALLBACK",
          lossCount: nextLossCount,
          circuitBreakerTripped: true,
          errorMessage:
            "WebGL context was lost 3 times. 3D sanctuary has been disabled for the remainder of this session to protect stability.",
        };
      }
      return {
        ...current,
        state: "3D_DEGRADED",
        lossCount: nextLossCount,
        errorMessage: `WebGL context lost (incident ${nextLossCount} of ${current.maxLosses}). Attempting bounded recovery...`,
      };
    }

    case "CONTEXT_RESTORED": {
      if (current.state === "3D_DEGRADED") {
        return {
          ...current,
          state: "3D_READY",
          errorMessage: null,
        };
      }
      return current;
    }

    case "RECOVERY_FAILED": {
      if (current.state === "3D_DEGRADED") {
        return {
          ...current,
          state: "3D_FALLBACK",
          errorMessage: event.reason || "WebGL context recovery attempt failed.",
        };
      }
      return current;
    }

    case "EXIT_TO_2D": {
      return {
        ...current,
        state: "2D",
        errorMessage: null,
      };
    }

    case "QUALITY_EXHAUSTED": {
      return {
        ...current,
        state: "3D_FALLBACK",
        errorMessage:
          "Spatial rendering paused to preserve device performance.",
      };
    }

    case "RESET": {
      if (current.circuitBreakerTripped) {
        return {
          ...current,
          state: "2D",
        };
      }
      return { ...INITIAL_VIEW_CONTEXT };
    }

    default:
      return current;
  }
}

/**
 * Monotonic Adaptive Quality Machine:
 * TIER_3 -> TIER_2 -> TIER_1 -> EXHAUSTED
 *
 * Invariants:
 * - Monotonicity: Upward promotion is strictly rejected during an active session.
 * - Hysteresis: Continuous degradation for DWELL_DURATION_MS (3000ms) required before stepping down.
 * - Recovery: If performance recovers (avg frame time <= threshold) before 3000ms, dwell timer resets to 0.
 * - Monotonic demotion: Dwell timer resets to 0 upon stepping down.
 * - Exhaustion: When tier becomes EXHAUSTED, caller is notified to emit QUALITY_EXHAUSTED to SpatialViewMachine.
 */
export function transitionQuality(
  current: QualityContext,
  event: QualityEvent
): QualityContext {
  switch (event.type) {
    case "PERF_SAMPLE": {
      if (current.tier === "EXHAUSTED") {
        return current;
      }

      const threshold = TIER_THRESHOLDS_MS[current.tier];
      if (event.avgDeltaMs > threshold) {
        const nextDwell = current.dwellElapsedMs + event.elapsedMs;
        if (nextDwell >= DWELL_DURATION_MS) {
          return stepDownQuality(current);
        }
        return {
          ...current,
          dwellElapsedMs: nextDwell,
        };
      } else {
        // Performance recovered before dwell duration: reset dwell timer
        if (current.dwellElapsedMs > 0) {
          return {
            ...current,
            dwellElapsedMs: 0,
          };
        }
        return current;
      }
    }

    case "STEP_DOWN": {
      return stepDownQuality(current);
    }

    case "ATTEMPT_PROMOTION": {
      // Upward promotion is strictly prohibited during an active 3D session
      return current;
    }

    case "RESET": {
      return { ...INITIAL_QUALITY_CONTEXT };
    }

    default:
      return current;
  }
}

function stepDownQuality(current: QualityContext): QualityContext {
  let nextTier: QualityTier;
  switch (current.tier) {
    case "TIER_3":
      nextTier = "TIER_2";
      break;
    case "TIER_2":
      nextTier = "TIER_1";
      break;
    case "TIER_1":
      nextTier = "EXHAUSTED";
      break;
    case "EXHAUSTED":
      return current;
  }

  const profile = QUALITY_PROFILES[nextTier];
  return {
    tier: nextTier,
    dwellElapsedMs: 0,
    targetDpr: profile.targetDpr,
    moteCount: profile.moteCount,
    shaderProfile: profile.shaderProfile,
  };
}

