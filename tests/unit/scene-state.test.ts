import { describe, it, expect } from "vitest";
import {
  transitionArtifact,
  transitionView,
  INITIAL_ARTIFACT_CONTEXT,
  INITIAL_VIEW_CONTEXT,
} from "@/components/sanctuary/3d/state/sanctuary3d.machine";
import type {
  ArtifactContext,
  ArtifactEvent,
  ArtifactState,
  SpatialViewState,
  ViewContext,
  ViewEvent,
} from "@/components/sanctuary/3d/state/sanctuary3d.types";

describe("Phase 3A: Pure Sanctuary State Machines", () => {
  describe("Artifact State Machine (DORMANT <-> PROXIMATE <-> FOCUSED -> ACTIVE)", () => {
    it("starts in DORMANT state with null activeId", () => {
      expect(INITIAL_ARTIFACT_CONTEXT).toEqual({
        activeId: null,
        state: "DORMANT",
      });
    });

    describe("Legal Transitions", () => {
      it("transitions DORMANT -> PROXIMATE on POINTER_ENTER", () => {
        const next = transitionArtifact(INITIAL_ARTIFACT_CONTEXT, {
          type: "POINTER_ENTER",
          id: "mem-1",
        });
        expect(next).toEqual({ state: "PROXIMATE", activeId: "mem-1" });
      });

      it("transitions DORMANT -> FOCUSED on FOCUS", () => {
        const next = transitionArtifact(INITIAL_ARTIFACT_CONTEXT, {
          type: "FOCUS",
          id: "mem-1",
        });
        expect(next).toEqual({ state: "FOCUSED", activeId: "mem-1" });
      });

      it("transitions PROXIMATE -> DORMANT on POINTER_LEAVE for active item", () => {
        const proximate: ArtifactContext = {
          state: "PROXIMATE",
          activeId: "mem-1",
        };
        const next = transitionArtifact(proximate, {
          type: "POINTER_LEAVE",
          id: "mem-1",
        });
        expect(next).toEqual({ state: "DORMANT", activeId: null });
      });

      it("transitions PROXIMATE -> FOCUSED on FOCUS", () => {
        const proximate: ArtifactContext = {
          state: "PROXIMATE",
          activeId: "mem-1",
        };
        const next = transitionArtifact(proximate, {
          type: "FOCUS",
          id: "mem-1",
        });
        expect(next).toEqual({ state: "FOCUSED", activeId: "mem-1" });
      });

      it("transitions FOCUSED -> ACTIVE on ACTIVATE for focused item", () => {
        const focused: ArtifactContext = {
          state: "FOCUSED",
          activeId: "mem-1",
        };
        const next = transitionArtifact(focused, {
          type: "ACTIVATE",
          id: "mem-1",
        });
        expect(next).toEqual({ state: "ACTIVE", activeId: "mem-1" });
      });

      it("transitions ACTIVE -> FOCUSED on ESCAPE (stepping down one level)", () => {
        const active: ArtifactContext = {
          state: "ACTIVE",
          activeId: "mem-1",
        };
        const next = transitionArtifact(active, { type: "ESCAPE" });
        expect(next).toEqual({ state: "FOCUSED", activeId: "mem-1" });
      });

      it("transitions FOCUSED -> DORMANT on ESCAPE", () => {
        const focused: ArtifactContext = {
          state: "FOCUSED",
          activeId: "mem-1",
        };
        const next = transitionArtifact(focused, { type: "ESCAPE" });
        expect(next).toEqual({ state: "DORMANT", activeId: null });
      });

      it("transitions PROXIMATE -> DORMANT on ESCAPE", () => {
        const proximate: ArtifactContext = {
          state: "PROXIMATE",
          activeId: "mem-1",
        };
        const next = transitionArtifact(proximate, { type: "ESCAPE" });
        expect(next).toEqual({ state: "DORMANT", activeId: null });
      });

      it("transitions from any state to DORMANT on RESET", () => {
        const states: ArtifactState[] = [
          "DORMANT",
          "PROXIMATE",
          "FOCUSED",
          "ACTIVE",
        ];
        for (const s of states) {
          const ctx: ArtifactContext = { state: s, activeId: "mem-xyz" };
          const next = transitionArtifact(ctx, { type: "RESET" });
          expect(next).toEqual({ state: "DORMANT", activeId: null });
        }
      });

      it("allows switching focus directly from FOCUSED(mem-1) to FOCUSED(mem-2)", () => {
        const focused: ArtifactContext = {
          state: "FOCUSED",
          activeId: "mem-1",
        };
        const next = transitionArtifact(focused, {
          type: "FOCUS",
          id: "mem-2",
        });
        expect(next).toEqual({ state: "FOCUSED", activeId: "mem-2" });
      });
    });

    describe("Explicitly Rejected Illegal Transitions", () => {
      it("rejects ACTIVATE from DORMANT", () => {
        const next = transitionArtifact(INITIAL_ARTIFACT_CONTEXT, {
          type: "ACTIVATE",
          id: "mem-1",
        });
        expect(next).toBe(INITIAL_ARTIFACT_CONTEXT);
        expect(next.state).toBe("DORMANT");
      });

      it("rejects ACTIVATE directly from PROXIMATE without FOCUSED", () => {
        const proximate: ArtifactContext = {
          state: "PROXIMATE",
          activeId: "mem-1",
        };
        const next = transitionArtifact(proximate, {
          type: "ACTIVATE",
          id: "mem-1",
        });
        expect(next).toBe(proximate);
        expect(next.state).toBe("PROXIMATE");
      });

      it("rejects ACTIVATE for a mismatched id in FOCUSED state", () => {
        const focused: ArtifactContext = {
          state: "FOCUSED",
          activeId: "mem-1",
        };
        const next = transitionArtifact(focused, {
          type: "ACTIVATE",
          id: "mem-different",
        });
        expect(next).toBe(focused);
        expect(next.state).toBe("FOCUSED");
      });

      it("ignores POINTER_LEAVE in FOCUSED state (DOM/keyboard focus dominates hover)", () => {
        const focused: ArtifactContext = {
          state: "FOCUSED",
          activeId: "mem-1",
        };
        const next = transitionArtifact(focused, {
          type: "POINTER_LEAVE",
          id: "mem-1",
        });
        expect(next).toBe(focused);
        expect(next.state).toBe("FOCUSED");
      });

      it("rejects POINTER_LEAVE for non-active id in PROXIMATE state", () => {
        const proximate: ArtifactContext = {
          state: "PROXIMATE",
          activeId: "mem-1",
        };
        const next = transitionArtifact(proximate, {
          type: "POINTER_LEAVE",
          id: "mem-other",
        });
        expect(next).toBe(proximate);
        expect(next.state).toBe("PROXIMATE");
        expect(next.activeId).toBe("mem-1");
      });

      it("is idempotent on repeated ESCAPE in DORMANT state", () => {
        let state = INITIAL_ARTIFACT_CONTEXT;
        for (let i = 0; i < 5; i++) {
          state = transitionArtifact(state, { type: "ESCAPE" });
          expect(state.state).toBe("DORMANT");
          expect(state.activeId).toBeNull();
        }
      });

      it("resets gracefully if an artifact is stale or deleted", () => {
        const staleState: ArtifactContext = {
          state: "FOCUSED",
          activeId: "deleted-artifact-id",
        };
        const resetState = transitionArtifact(staleState, { type: "RESET" });
        expect(resetState).toEqual({ state: "DORMANT", activeId: null });
      });
    });
  });

  describe("Spatial View State Machine (2D <-> 3D_LOADING <-> 3D_READY / 3D_DEGRADED / 3D_FALLBACK)", () => {
    it("starts in 2D canonical state with 0 losses", () => {
      expect(INITIAL_VIEW_CONTEXT).toEqual({
        state: "2D",
        lossCount: 0,
        maxLosses: 3,
        circuitBreakerTripped: false,
        errorMessage: null,
      });
    });

    describe("Normal Opt-in and Exit Lifecycle", () => {
      it("transitions 2D -> 3D_LOADING on ENTER_3D", () => {
        const next = transitionView(INITIAL_VIEW_CONTEXT, {
          type: "ENTER_3D",
        });
        expect(next.state).toBe("3D_LOADING");
        expect(next.errorMessage).toBeNull();
      });

      it("transitions 3D_LOADING -> 3D_READY on SCENE_READY", () => {
        const loading: ViewContext = {
          ...INITIAL_VIEW_CONTEXT,
          state: "3D_LOADING",
        };
        const next = transitionView(loading, { type: "SCENE_READY" });
        expect(next.state).toBe("3D_READY");
        expect(next.errorMessage).toBeNull();
      });

      it("transitions back to 2D on EXIT_TO_2D", () => {
        const ready: ViewContext = {
          ...INITIAL_VIEW_CONTEXT,
          state: "3D_READY",
        };
        const next = transitionView(ready, { type: "EXIT_TO_2D" });
        expect(next.state).toBe("2D");
      });
    });

    describe("WebGL Unavailable Handling", () => {
      it("transitions 3D_LOADING -> 3D_FALLBACK on WEBGL_UNAVAILABLE", () => {
        const loading: ViewContext = {
          ...INITIAL_VIEW_CONTEXT,
          state: "3D_LOADING",
        };
        const next = transitionView(loading, {
          type: "WEBGL_UNAVAILABLE",
          reason: "No hardware acceleration detected",
        });
        expect(next.state).toBe("3D_FALLBACK");
        expect(next.errorMessage).toBe("No hardware acceleration detected");
        expect(next.circuitBreakerTripped).toBe(false);
      });
    });

    describe("Bounded Context-Loss Recovery and Circuit Breaker", () => {
      it("Loss #1: pauses and transitions 3D_READY -> 3D_DEGRADED with bounded recovery message", () => {
        const ready: ViewContext = {
          ...INITIAL_VIEW_CONTEXT,
          state: "3D_READY",
          lossCount: 0,
        };
        const next = transitionView(ready, { type: "CONTEXT_LOST" });
        expect(next.state).toBe("3D_DEGRADED");
        expect(next.lossCount).toBe(1);
        expect(next.circuitBreakerTripped).toBe(false);
        expect(next.errorMessage).toContain("incident 1 of 3");
      });

      it("Loss #1 Recovery Success: transitions 3D_DEGRADED -> 3D_READY on CONTEXT_RESTORED", () => {
        const degraded: ViewContext = {
          ...INITIAL_VIEW_CONTEXT,
          state: "3D_DEGRADED",
          lossCount: 1,
        };
        const next = transitionView(degraded, { type: "CONTEXT_RESTORED" });
        expect(next.state).toBe("3D_READY");
        expect(next.lossCount).toBe(1);
        expect(next.errorMessage).toBeNull();
      });

      it("Loss #1 Recovery Failure: transitions 3D_DEGRADED -> 3D_FALLBACK on RECOVERY_FAILED", () => {
        const degraded: ViewContext = {
          ...INITIAL_VIEW_CONTEXT,
          state: "3D_DEGRADED",
          lossCount: 1,
        };
        const next = transitionView(degraded, {
          type: "RECOVERY_FAILED",
          reason: "WebGL context could not be re-acquired",
        });
        expect(next.state).toBe("3D_FALLBACK");
        expect(next.lossCount).toBe(1);
        expect(next.errorMessage).toBe("WebGL context could not be re-acquired");
      });

      it("Loss #2: transitions 3D_READY -> 3D_DEGRADED on second loss", () => {
        const readyAfter1: ViewContext = {
          ...INITIAL_VIEW_CONTEXT,
          state: "3D_READY",
          lossCount: 1,
        };
        const next = transitionView(readyAfter1, { type: "CONTEXT_LOST" });
        expect(next.state).toBe("3D_DEGRADED");
        expect(next.lossCount).toBe(2);
        expect(next.circuitBreakerTripped).toBe(false);
        expect(next.errorMessage).toContain("incident 2 of 3");
      });

      it("Loss #3: trips session circuit breaker, transitions to 3D_FALLBACK, disables 3D", () => {
        const degraded2: ViewContext = {
          ...INITIAL_VIEW_CONTEXT,
          state: "3D_READY",
          lossCount: 2,
        };
        const next = transitionView(degraded2, { type: "CONTEXT_LOST" });
        expect(next.state).toBe("3D_FALLBACK");
        expect(next.lossCount).toBe(3);
        expect(next.circuitBreakerTripped).toBe(true);
        expect(next.errorMessage).toContain("lost 3 times");
      });

      it("Rejects ENTER_3D once circuit breaker is tripped", () => {
        const trippedContext: ViewContext = {
          ...INITIAL_VIEW_CONTEXT,
          state: "2D",
          lossCount: 3,
          circuitBreakerTripped: true,
          errorMessage: null,
        };
        const attempt = transitionView(trippedContext, { type: "ENTER_3D" });
        expect(attempt.state).toBe("3D_FALLBACK");
        expect(attempt.circuitBreakerTripped).toBe(true);
        expect(attempt.errorMessage).toContain("disabled for this session");
      });

      it("RESET retains circuit breaker flag to prevent infinite crash loops", () => {
        const trippedContext: ViewContext = {
          ...INITIAL_VIEW_CONTEXT,
          state: "3D_FALLBACK",
          lossCount: 3,
          circuitBreakerTripped: true,
          errorMessage: "Tripped",
        };
        const resetState = transitionView(trippedContext, { type: "RESET" });
        expect(resetState.state).toBe("2D");
        expect(resetState.circuitBreakerTripped).toBe(true);
      });
    });

    describe("Independence of Artifact State and WebGL Context Loss", () => {
      it("WebGL context loss alters view state without corrupting artifact state machine", () => {
        // Artifact in FOCUSED state
        const artifact: ArtifactContext = {
          state: "FOCUSED",
          activeId: "mem-42",
        };
        const view: ViewContext = {
          ...INITIAL_VIEW_CONTEXT,
          state: "3D_READY",
        };

        // Context lost
        const nextView = transitionView(view, { type: "CONTEXT_LOST" });
        expect(nextView.state).toBe("3D_DEGRADED");

        // Artifact machine remains completely independent and uncorrupted
        expect(artifact.state).toBe("FOCUSED");
        expect(artifact.activeId).toBe("mem-42");

        // Artifact machine can still receive events normally (e.g. DOM navigation escape)
        const unhovered = transitionArtifact(artifact, { type: "ESCAPE" });
        expect(unhovered.state).toBe("DORMANT");
        expect(unhovered.activeId).toBeNull();
      });
    });
  });

  describe("Comprehensive Transition/Event Matrix Validation", () => {
    it("tests every legal and rejected event across all artifact states", () => {
      const allArtifactStates: ArtifactState[] = [
        "DORMANT",
        "PROXIMATE",
        "FOCUSED",
        "ACTIVE",
      ];
      const allEventTypes: ArtifactEvent["type"][] = [
        "POINTER_ENTER",
        "POINTER_LEAVE",
        "FOCUS",
        "ACTIVATE",
        "ESCAPE",
        "RESET",
      ];

      for (const s of allArtifactStates) {
        for (const evType of allEventTypes) {
          const current: ArtifactContext = {
            state: s,
            activeId: s === "DORMANT" ? null : "target-id",
          };
          let event: ArtifactEvent;
          if (evType === "POINTER_ENTER" || evType === "FOCUS" || evType === "ACTIVATE") {
            event = { type: evType, id: "target-id" };
          } else if (evType === "POINTER_LEAVE") {
            event = { type: "POINTER_LEAVE", id: "target-id" };
          } else {
            event = { type: evType };
          }

          const result = transitionArtifact(current, event);
          expect(result).toBeDefined();
          expect(["DORMANT", "PROXIMATE", "FOCUSED", "ACTIVE"]).toContain(
            result.state
          );
        }
      }
    });

    it("tests every legal and rejected event across all spatial view states", () => {
      const allViewStates: SpatialViewState[] = [
        "2D",
        "3D_LOADING",
        "3D_READY",
        "3D_DEGRADED",
        "3D_FALLBACK",
      ];
      const allEventTypes: ViewEvent["type"][] = [
        "ENTER_3D",
        "SCENE_READY",
        "WEBGL_UNAVAILABLE",
        "CONTEXT_LOST",
        "CONTEXT_RESTORED",
        "RECOVERY_FAILED",
        "EXIT_TO_2D",
        "RESET",
      ];

      for (const s of allViewStates) {
        for (const evType of allEventTypes) {
          const current: ViewContext = {
            state: s,
            lossCount: s === "3D_DEGRADED" ? 1 : 0,
            maxLosses: 3,
            circuitBreakerTripped: false,
            errorMessage: null,
          };
          const event: ViewEvent = { type: evType };
          const result = transitionView(current, event);
          expect(result).toBeDefined();
          expect([
            "2D",
            "3D_LOADING",
            "3D_READY",
            "3D_DEGRADED",
            "3D_FALLBACK",
          ]).toContain(result.state);
        }
      }
    });
  });

  describe("Spatial Projection & Capability Detection", () => {
    it("checkWebGLSupport detects SSR / non-browser environment safely", async () => {
      const { checkWebGLSupport } = await import(
        "@/components/sanctuary/3d/SanctuaryCanvas"
      );
      const result = checkWebGLSupport();
      expect(result.supported).toBe(false);
      expect(result.reason).toBe("Server rendering");
    });

    it("computeSpatialPositions creates deterministic 3D coordinates from safe projections", async () => {
      const { computeSpatialPositions } = await import(
        "@/components/sanctuary/3d/SanctuaryCanvas"
      );
      const sampleMemories = [
        {
          id: "mem-1",
          kind: "standard" as const,
          title: "Memory 1",
          description: "Desc 1",
          bodyText: "Text 1",
          memoryDate: "2024-01-01",
          location: null,
          emotion: "joy",
          threadKey: null,
          sortOrder: 0,
          isFavorite: true,
          isDraft: false,
          chapter: { id: "ch-1", title: "Chapter 1" },
          assets: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "mem-2",
          kind: "letter" as const,
          title: "Memory 2",
          description: "Desc 2",
          bodyText: "Text 2",
          memoryDate: "2024-02-01",
          location: null,
          emotion: "love",
          threadKey: null,
          sortOrder: 1,
          isFavorite: false,
          isDraft: false,
          chapter: null,
          assets: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const spatialData = computeSpatialPositions(sampleMemories);
      expect(spatialData).toHaveLength(2);
      expect(spatialData[0].id).toBe("mem-1");
      expect(spatialData[0].kind).toBe("standard");
      expect(spatialData[0].position).toHaveLength(3);
      expect(typeof spatialData[0].position[0]).toBe("number");
      expect(typeof spatialData[0].position[1]).toBe("number");
      expect(typeof spatialData[0].position[2]).toBe("number");

      // Verify strict security projection: NO storageKey, NO signed URLs
      for (const item of spatialData) {
        const raw = item as unknown as Record<string, unknown>;
        expect(raw.storageKey).toBeUndefined();
        expect(raw.signedUrl).toBeUndefined();
        expect(raw.sessionToken).toBeUndefined();
      }
    });

    it("handles empty memory list without errors", async () => {
      const { computeSpatialPositions } = await import(
        "@/components/sanctuary/3d/SanctuaryCanvas"
      );
      const result = computeSpatialPositions([]);
      expect(result).toEqual([]);
    });
  });
});

