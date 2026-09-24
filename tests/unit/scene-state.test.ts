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
import type { PlacedMemory } from "@/components/sanctuary/3d/islands/ArchipelagoLayout";
import type { MemorySummary } from "@/lib/data/memories";

describe("Phase 3A: Pure Sanctuary State Machines", () => {


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
          spatialFocus: { kind: "memory", memoryId: "mem-42" },
          hoveredId: null,
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
        expect(artifact.spatialFocus).toEqual({ kind: "memory", memoryId: "mem-42" });

        // Artifact machine can still receive events normally (e.g. DOM navigation escape)
        const unhovered = transitionArtifact(artifact, { type: "ESCAPE" });
        expect(unhovered.state).toBe("DORMANT");
        expect(unhovered.spatialFocus).toEqual({ kind: "none" });
      });
    });
  });

  describe("Comprehensive Transition/Event Matrix Validation", () => {

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

  describe("Render-Set Partition Invariant & OUTSIDE_RENDER_VOLUME Exclusion (Gate 3B.1)", () => {
    // Helper to generate placed memories for testing
    function createMockPlacedMemory(
      id: string,
      chapterId: string | null,
      worldPosition: [number, number, number]
    ): PlacedMemory {
      return {
        id,
        chapterId,
        kind: "standard",
        title: `Memory ${id}`,
        worldPosition,
        localOffset: [0, 0, 0],
        islandCenter: [0, 0, 0],
        isProximateAnchor: true,
      };
    }

    it("proves the complete partition invariant: Every memory ∈ exactly one of {FOCUSED, PROXIMATE, DISTANT, OUTSIDE}", async () => {
      const { partitionSceneMemories } = await import(
        "@/components/sanctuary/3d/state/sanctuary3d.partition"
      );

      // Create a diverse set of memories:
      // - mem-focus: at (10, 0, 10) on chapter 'ch-1' (dist ~14.14 < 50) -> will be FOCUSED
      // - mem-prox-1..6: at (12, 0, 10) on chapter 'ch-1' -> up to 5 PROXIMATE, 6th is DISTANT
      // - mem-dist-1..5: at (20, 0, 20) on chapter 'ch-2' -> DISTANT
      // - mem-out-1: at (55, 0, 0) (dist 55 > 50) -> OUTSIDE_RENDER_VOLUME
      // - mem-out-2: at (0, 0, -60) (dist 60 > 50) -> OUTSIDE_RENDER_VOLUME
      // - mem-out-active: at (70, 0, 0) on chapter 'ch-out' (even if active, must be OUTSIDE)
      const mockMemories: PlacedMemory[] = [
        createMockPlacedMemory("mem-focus", "ch-1", [10, 0, 10]),
        createMockPlacedMemory("mem-prox-1", "ch-1", [11, 0, 10]),
        createMockPlacedMemory("mem-prox-2", "ch-1", [12, 0, 10]),
        createMockPlacedMemory("mem-prox-3", "ch-1", [13, 0, 10]),
        createMockPlacedMemory("mem-prox-4", "ch-1", [14, 0, 10]),
        createMockPlacedMemory("mem-prox-5", "ch-1", [15, 0, 10]),
        createMockPlacedMemory("mem-prox-6", "ch-1", [16, 0, 10]), // Exceeds MAX_PROXIMATE_COUNT (5) -> DISTANT
        createMockPlacedMemory("mem-dist-1", "ch-2", [20, 0, 20]),
        createMockPlacedMemory("mem-dist-2", "ch-2", [22, 0, 20]),
        createMockPlacedMemory("mem-out-1", "ch-3", [55, 0, 0]),
        createMockPlacedMemory("mem-out-2", "ch-3", [0, 0, -60]),
        createMockPlacedMemory("mem-out-3", "ch-4", [40, 0, 40]), // 40^2 + 40^2 = 3200 > 2500 -> OUTSIDE
      ];

      const memoryLookup = new Map<string, MemorySummary>();
      for (const m of mockMemories) {
        memoryLookup.set(m.id, {
          id: m.id,
          kind: "standard",
          title: m.title,
          description: null,
          bodyText: "",
          memoryDate: "2024-01-01",
          location: null,
          emotion: null,
          threadKey: null,
          sortOrder: 0,
          isFavorite: false,
          isDraft: false,
          chapter: m.chapterId ? { id: m.chapterId, title: m.chapterId } : null,
          assets: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      const activeId = "mem-focus";
      const result = partitionSceneMemories(mockMemories, memoryLookup, activeId);

      // Extract ID sets
      const focusedIds = new Set(result.focusedData ? [result.focusedData.id] : []);
      const proximateIds = new Set(result.proximateData.map((m) => m.id));
      const distantIds = new Set(result.distantData.map((m) => m.id));
      const outsideIds = new Set(result.outsideVolumeData.map((m) => m.id));
      const allIds = new Set(mockMemories.map((m) => m.id));

      // 1. Invariant: Completeness
      // |FOCUSED| + |PROXIMATE| + |DISTANT| + |OUTSIDE| === |ALL|
      expect(
        focusedIds.size + proximateIds.size + distantIds.size + outsideIds.size
      ).toBe(allIds.size);
      expect(result.partitionMap.size).toBe(allIds.size);

      // 2. Invariant: Mutual Exclusion
      // FOCUSED ∩ PROXIMATE = ∅
      for (const id of focusedIds) {
        expect(proximateIds.has(id)).toBe(false);
      }

      // FOCUSED ∩ DISTANT = ∅
      for (const id of focusedIds) {
        expect(distantIds.has(id)).toBe(false);
      }

      // PROXIMATE ∩ DISTANT = ∅
      for (const id of proximateIds) {
        expect(distantIds.has(id)).toBe(false);
      }

      // OUTSIDE ∩ (FOCUSED ∪ PROXIMATE ∪ DISTANT) = ∅
      const renderedIds = new Set([...focusedIds, ...proximateIds, ...distantIds]);
      for (const id of outsideIds) {
        expect(renderedIds.has(id)).toBe(false);
      }

      // 3. Invariant: Union covers ALL
      // FOCUSED ∪ PROXIMATE ∪ DISTANT ∪ OUTSIDE = ALL
      const unionAll = new Set([...renderedIds, ...outsideIds]);
      expect(unionAll.size).toBe(allIds.size);
      for (const id of allIds) {
        expect(unionAll.has(id)).toBe(true);
      }

      // 4. Exact Set Verification:
      expect(focusedIds).toEqual(new Set(["mem-focus"]));
      expect(proximateIds.size).toBe(5); // Capped at MAX_PROXIMATE_COUNT
      expect(distantIds.has("mem-prox-6")).toBe(true); // 6th proximate overflowed to distant
      expect(distantIds.has("mem-dist-1")).toBe(true);
      expect(distantIds.has("mem-dist-2")).toBe(true);
      expect(outsideIds).toEqual(new Set(["mem-out-1", "mem-out-2", "mem-out-3"]));
    });

    it("guarantees OUTSIDE_RENDER_VOLUME exclusion from every GPU-facing payload", async () => {
      const { partitionSceneMemories } = await import(
        "@/components/sanctuary/3d/state/sanctuary3d.partition"
      );

      // Edge case: An activeId is set to an item that is OUTSIDE the render volume
      const mockMemories: PlacedMemory[] = [
        createMockPlacedMemory("mem-far-active", "ch-1", [100, 0, 100]), // Outside!
        createMockPlacedMemory("mem-near-1", "ch-1", [10, 0, 10]),
        createMockPlacedMemory("mem-near-2", "ch-2", [15, 0, 15]),
      ];

      const memoryLookup = new Map<string, MemorySummary>();
      for (const m of mockMemories) {
        memoryLookup.set(m.id, {
          id: m.id,
          kind: "standard",
          title: m.title,
          description: null,
          bodyText: "",
          memoryDate: "2024-01-01",
          location: null,
          emotion: null,
          threadKey: null,
          sortOrder: 0,
          isFavorite: false,
          isDraft: false,
          chapter: null,
          assets: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      const result = partitionSceneMemories(mockMemories, memoryLookup, "mem-far-active");

      // Because 'mem-far-active' is outside volume (distSq > 50^2), it MUST be excluded from focusedData
      expect(result.focusedData).toBeNull();
      expect(result.outsideVolumeData.map((m) => m.id)).toContain("mem-far-active");

      // Verify no item in GPU-facing payloads exceeds render volume distance
      const gpuFacingPayloads = [
        ...(result.focusedData ? [result.focusedData] : []),
        ...result.proximateData,
        ...result.distantData,
      ];

      for (const item of gpuFacingPayloads) {
        const distSq = item.position[0] * item.position[0] + item.position[2] * item.position[2];
        expect(distSq).toBeLessThanOrEqual(50 * 50);
        expect(item.id).not.toBe("mem-far-active");
      }
    });
  });
});

