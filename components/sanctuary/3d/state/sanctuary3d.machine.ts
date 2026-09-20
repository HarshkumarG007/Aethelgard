import type {
  ArtifactContext,
  ArtifactEvent,
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
