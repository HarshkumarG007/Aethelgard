import { describe, it, expect, beforeEach } from "vitest";
import {
  transitionQuality,
  transitionView,
  INITIAL_QUALITY_CONTEXT,
  INITIAL_VIEW_CONTEXT,
  QUALITY_PROFILES,
} from "@/components/sanctuary/3d/state/sanctuary3d.machine";
import type {
  QualityContext,
} from "@/components/sanctuary/3d/state/sanctuary3d.types";
import { useSanctuary3DStore } from "@/components/sanctuary/3d/state/sanctuary3d.store";

describe("Sub-Gate 3B.2: QualityMachine & Cross-Machine Integration", () => {
  describe("Initial State & Profiles", () => {
    it("starts in TIER_3 with expected configuration", () => {
      expect(INITIAL_QUALITY_CONTEXT).toEqual({
        tier: "TIER_3",
        dwellElapsedMs: 0,
        targetDpr: 1.5,
        moteCount: 300,
        shaderProfile: "full",
      });
    });

    it("defines correct profile constants for each tier", () => {
      expect(QUALITY_PROFILES.TIER_3).toEqual({
        targetDpr: 1.5,
        moteCount: 300,
        shaderProfile: "full",
      });
      expect(QUALITY_PROFILES.TIER_2).toEqual({
        targetDpr: 1.0,
        moteCount: 120,
        shaderProfile: "static",
      });
      expect(QUALITY_PROFILES.TIER_1).toEqual({
        targetDpr: 0.75,
        moteCount: 0,
        shaderProfile: "standard",
      });
      expect(QUALITY_PROFILES.EXHAUSTED).toEqual({
        targetDpr: 0.0,
        moteCount: 0,
        shaderProfile: "standard",
      });
    });
  });

  describe("Monotonic Progression & Dwell Timers", () => {
    it("accumulates dwell time when avgDeltaMs exceeds threshold", () => {
      const state1 = transitionQuality(INITIAL_QUALITY_CONTEXT, {
        type: "PERF_SAMPLE",
        avgDeltaMs: 40.0, // > 33.33ms
        elapsedMs: 1000,
      });

      expect(state1.tier).toBe("TIER_3");
      expect(state1.dwellElapsedMs).toBe(1000);

      const state2 = transitionQuality(state1, {
        type: "PERF_SAMPLE",
        avgDeltaMs: 45.0,
        elapsedMs: 1000,
      });

      expect(state2.tier).toBe("TIER_3");
      expect(state2.dwellElapsedMs).toBe(2000);
    });

    it("resets dwell timer to 0 if performance recovers before 3,000ms threshold", () => {
      let state = transitionQuality(INITIAL_QUALITY_CONTEXT, {
        type: "PERF_SAMPLE",
        avgDeltaMs: 40.0,
        elapsedMs: 1800,
      });
      expect(state.dwellElapsedMs).toBe(1800);

      // Performance recovers (16.6ms <= 33.33ms)
      state = transitionQuality(state, {
        type: "PERF_SAMPLE",
        avgDeltaMs: 16.6,
        elapsedMs: 500,
      });

      expect(state.tier).toBe("TIER_3");
      expect(state.dwellElapsedMs).toBe(0);

      // Subsequent degraded sample must start dwell timer from 0 again
      state = transitionQuality(state, {
        type: "PERF_SAMPLE",
        avgDeltaMs: 42.0,
        elapsedMs: 1000,
      });
      expect(state.dwellElapsedMs).toBe(1000);
    });

    it("demotes TIER_3 -> TIER_2 once continuous dwell reaches 3,000ms", () => {
      let state = INITIAL_QUALITY_CONTEXT;

      // Accumulate 2,000ms
      state = transitionQuality(state, {
        type: "PERF_SAMPLE",
        avgDeltaMs: 38.0,
        elapsedMs: 2000,
      });
      expect(state.tier).toBe("TIER_3");

      // Reach 3,000ms
      state = transitionQuality(state, {
        type: "PERF_SAMPLE",
        avgDeltaMs: 38.0,
        elapsedMs: 1000,
      });

      expect(state.tier).toBe("TIER_2");
      expect(state.dwellElapsedMs).toBe(0); // Resets upon demotion
      expect(state.targetDpr).toBe(1.0);
      expect(state.moteCount).toBe(120);
      expect(state.shaderProfile).toBe("static");
    });

    it("demotes TIER_2 -> TIER_1 once continuous dwell reaches 3,000ms", () => {
      let state: QualityContext = {
        tier: "TIER_2",
        dwellElapsedMs: 0,
        targetDpr: 1.0,
        moteCount: 120,
        shaderProfile: "static",
      };

      state = transitionQuality(state, {
        type: "PERF_SAMPLE",
        avgDeltaMs: 36.0, // > 33.33ms
        elapsedMs: 3000,
      });

      expect(state.tier).toBe("TIER_1");
      expect(state.dwellElapsedMs).toBe(0);
      expect(state.targetDpr).toBe(0.75);
      expect(state.moteCount).toBe(0);
      expect(state.shaderProfile).toBe("standard");
    });

    it("in TIER_1, does not demote if frame time is <= 50.0ms (threshold is 50.0ms for Tier 1)", () => {
      let state: QualityContext = {
        tier: "TIER_1",
        dwellElapsedMs: 0,
        targetDpr: 0.75,
        moteCount: 0,
        shaderProfile: "standard",
      };

      // 40ms is > 33.33ms, but <= 50.0ms for Tier 1
      state = transitionQuality(state, {
        type: "PERF_SAMPLE",
        avgDeltaMs: 40.0,
        elapsedMs: 3000,
      });

      expect(state.tier).toBe("TIER_1");
      expect(state.dwellElapsedMs).toBe(0);
    });

    it("demotes TIER_1 -> EXHAUSTED once frame time > 50.0ms for 3,000ms", () => {
      let state: QualityContext = {
        tier: "TIER_1",
        dwellElapsedMs: 0,
        targetDpr: 0.75,
        moteCount: 0,
        shaderProfile: "standard",
      };

      state = transitionQuality(state, {
        type: "PERF_SAMPLE",
        avgDeltaMs: 55.0, // > 50.0ms
        elapsedMs: 3000,
      });

      expect(state.tier).toBe("EXHAUSTED");
      expect(state.dwellElapsedMs).toBe(0);
      expect(state.targetDpr).toBe(0.0);
    });

    it("remains EXHAUSTED on subsequent samples", () => {
      let state: QualityContext = {
        tier: "EXHAUSTED",
        dwellElapsedMs: 0,
        targetDpr: 0.0,
        moteCount: 0,
        shaderProfile: "standard",
      };

      state = transitionQuality(state, {
        type: "PERF_SAMPLE",
        avgDeltaMs: 60.0,
        elapsedMs: 3000,
      });

      expect(state.tier).toBe("EXHAUSTED");
    });
  });

  describe("Monotonicity Enforcement (No Upward Promotion During Active Session)", () => {
    it("rejects promotion from TIER_1 to TIER_2 or TIER_3", () => {
      const tier1State: QualityContext = {
        tier: "TIER_1",
        dwellElapsedMs: 500,
        targetDpr: 0.75,
        moteCount: 0,
        shaderProfile: "standard",
      };

      const result1 = transitionQuality(tier1State, {
        type: "ATTEMPT_PROMOTION",
        targetTier: "TIER_2",
      });
      expect(result1).toEqual(tier1State);

      const result2 = transitionQuality(tier1State, {
        type: "ATTEMPT_PROMOTION",
        targetTier: "TIER_3",
      });
      expect(result2).toEqual(tier1State);
    });

    it("rejects promotion from TIER_2 to TIER_3", () => {
      const tier2State: QualityContext = {
        tier: "TIER_2",
        dwellElapsedMs: 0,
        targetDpr: 1.0,
        moteCount: 120,
        shaderProfile: "static",
      };

      const result = transitionQuality(tier2State, {
        type: "ATTEMPT_PROMOTION",
        targetTier: "TIER_3",
      });
      expect(result).toEqual(tier2State);
    });

    it("rejects promotion from EXHAUSTED", () => {
      const exhaustedState: QualityContext = {
        tier: "EXHAUSTED",
        dwellElapsedMs: 0,
        targetDpr: 0,
        moteCount: 0,
        shaderProfile: "standard",
      };

      const result = transitionQuality(exhaustedState, {
        type: "ATTEMPT_PROMOTION",
        targetTier: "TIER_3",
      });
      expect(result).toEqual(exhaustedState);
    });
  });

  describe("Manual Step-Down and Reset", () => {
    it("steps down through all tiers sequentially on STEP_DOWN", () => {
      let state = INITIAL_QUALITY_CONTEXT;

      state = transitionQuality(state, { type: "STEP_DOWN" });
      expect(state.tier).toBe("TIER_2");

      state = transitionQuality(state, { type: "STEP_DOWN" });
      expect(state.tier).toBe("TIER_1");

      state = transitionQuality(state, { type: "STEP_DOWN" });
      expect(state.tier).toBe("EXHAUSTED");

      // Cannot step down further
      state = transitionQuality(state, { type: "STEP_DOWN" });
      expect(state.tier).toBe("EXHAUSTED");
    });

    it("resets to initial TIER_3 on RESET", () => {
      const degradedState: QualityContext = {
        tier: "TIER_1",
        dwellElapsedMs: 1500,
        targetDpr: 0.75,
        moteCount: 0,
        shaderProfile: "standard",
      };

      const resetState = transitionQuality(degradedState, { type: "RESET" });
      expect(resetState).toEqual(INITIAL_QUALITY_CONTEXT);
    });
  });

  describe("Cross-Machine Integration (QualityMachine -> SpatialViewMachine)", () => {
    it("transitions SpatialViewMachine to 3D_FALLBACK on QUALITY_EXHAUSTED", () => {
      const readyView = {
        ...INITIAL_VIEW_CONTEXT,
        state: "3D_READY" as const,
      };

      const nextView = transitionView(readyView, {
        type: "QUALITY_EXHAUSTED",
      });

      expect(nextView.state).toBe("3D_FALLBACK");
      expect(nextView.errorMessage).toBe(
        "Spatial rendering paused to preserve device performance."
      );
    });

    it("triggers QUALITY_EXHAUSTED through useSanctuary3DStore when quality reaches EXHAUSTED", () => {
      const store = useSanctuary3DStore.getState();
      store.enter3D();
      store.setSceneReady();

      expect(useSanctuary3DStore.getState().view.state).toBe("3D_READY");
      expect(useSanctuary3DStore.getState().quality.tier).toBe("TIER_3");

      // Step down to TIER_2
      useSanctuary3DStore.getState().stepDownQuality();
      expect(useSanctuary3DStore.getState().quality.tier).toBe("TIER_2");
      expect(useSanctuary3DStore.getState().view.state).toBe("3D_READY");

      // Step down to TIER_1
      useSanctuary3DStore.getState().stepDownQuality();
      expect(useSanctuary3DStore.getState().quality.tier).toBe("TIER_1");
      expect(useSanctuary3DStore.getState().view.state).toBe("3D_READY");

      // Step down to EXHAUSTED -> triggers cross-machine view transition
      useSanctuary3DStore.getState().stepDownQuality();
      expect(useSanctuary3DStore.getState().quality.tier).toBe("EXHAUSTED");
      expect(useSanctuary3DStore.getState().view.state).toBe("3D_FALLBACK");
      expect(useSanctuary3DStore.getState().view.errorMessage).toContain(
        "preserve device performance"
      );

      // Clean up
      useSanctuary3DStore.getState().exitTo2D();
    });
  });
});
