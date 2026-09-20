import { describe, it, expect, beforeEach } from "vitest";
import {
  transitionQuality,
  transitionView,
  INITIAL_QUALITY_CONTEXT,
  INITIAL_VIEW_CONTEXT,
  QUALITY_PROFILES,
} from "@/components/sanctuary/3d/state/sanctuary3d.machine";
import type { QualityContext } from "@/components/sanctuary/3d/state/sanctuary3d.types";
import { useSanctuary3DStore } from "@/components/sanctuary/3d/state/sanctuary3d.store";
import { AQCRollingWindow } from "@/components/sanctuary/3d/quality/AdaptiveQualityController";

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
        "Spatial rendering paused to preserve device performance.",
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
        "preserve device performance",
      );

      // Clean up
      useSanctuary3DStore.getState().exitTo2D();
    });
  });

  describe("AQC Temporal Semantics (Rolling Window & Dwell)", () => {
    it("proves exact boundary semantics: window = (t - 1000ms, t] at t=1000 and t=1001 with independent calculations", () => {
      const w = new AQCRollingWindow();

      // t=0 sample A (delta 20)
      w.addSample(0, 20);
      // t=400 sample B (delta 25)
      w.addSample(400, 25);
      // t=800 sample C (delta 30)
      w.addSample(800, 30);
      // t=1000 sample D (delta 35)
      w.addSample(1000, 35);

      // At t=1000:
      // window is strictly (0, 1000]
      // A (t=0) is EXCLUDED because 0 <= 1000 - 1000 = 0
      // B (t=400), C (t=800), D (t=1000) are INCLUDED
      expect(w.count).toBe(3);
      const expectedAvg1000 = (25 + 30 + 35) / 3; // 30.0
      expect(w.getAverage(1000)).toBeCloseTo(expectedAvg1000, 5);

      // At t=1001:
      // sample E (delta 40) is added
      w.addSample(1001, 40);
      // window is (1, 1001]
      // B (t=400) > 1 -> INCLUDED
      // C (t=800) > 1 -> INCLUDED
      // D (t=1000) > 1 -> INCLUDED
      // E (t=1001) > 1 -> INCLUDED
      expect(w.count).toBe(4);
      const expectedAvg1001 = (25 + 30 + 35 + 40) / 4; // 32.5
      expect(w.getAverage(1001)).toBeCloseTo(expectedAvg1001, 5);

      // At t=1400:
      // sample F (delta 20) is added
      w.addSample(1400, 20);
      // window is (400, 1400]
      // B (t=400) is EXCLUDED because 400 <= 1400 - 1000 = 400
      // C (t=800), D (t=1000), E (t=1001), F (t=1400) are INCLUDED
      expect(w.count).toBe(4);
      const expectedAvg1400 = (30 + 35 + 40 + 20) / 4; // 31.25
      expect(w.getAverage(1400)).toBeCloseTo(expectedAvg1400, 5);
    });

    it("respects partial-window startup and guards demotion until primed (>= 1,000ms)", () => {
      const w = new AQCRollingWindow();

      // First sample at t=100
      w.addSample(100, 40);
      expect(w.isWindowPrimed(100)).toBe(false);
      expect(w.getAverage(100)).toBe(40);

      // More samples within startup phase
      for (let t = 200; t <= 800; t += 100) {
        w.addSample(t, 40);
      }
      expect(w.isWindowPrimed(800)).toBe(false); // 800 - 100 = 700ms < 1000ms

      // At t=1100, 1000ms has elapsed since first sample -> primed
      w.addSample(1100, 40);
      expect(w.isWindowPrimed(1100)).toBe(true); // 1100 - 100 = 1000ms >= 1000ms
    });

    it("demonstrates mathematical equivalence across 30Hz, 60Hz, 120Hz, 144Hz, and 240Hz refresh rates", () => {
      const frequencies = [30, 60, 120, 144, 240];

      for (const hz of frequencies) {
        const w = new AQCRollingWindow();
        const delta = 1000 / hz;

        // Feed 1.5 seconds worth of frames at this frequency
        const totalFrames = Math.floor(hz * 1.5);
        for (let i = 0; i < totalFrames; i++) {
          const timestamp = i * delta;
          w.addSample(timestamp, delta);
        }

        const now = (totalFrames - 1) * delta;
        // In the last 1,000ms window, the count should equal hz
        expect(w.count).toBe(hz);
        // The rolling average must match the exact frame delta
        expect(w.getAverage(now)).toBeCloseTo(delta, 3);
      }
    });

    it("computes accurate arithmetic average under irregular and bursty frame timings", () => {
      const w = new AQCRollingWindow();

      // Simulate irregular jitter: 10 frames of 10ms, then 5 frames of 50ms, then 15 frames of 20ms
      let t = 0;
      let totalDeltas = 0;
      let sampleCount = 0;

      const addPattern = (count: number, delta: number) => {
        for (let i = 0; i < count; i++) {
          t += delta;
          w.addSample(t, delta);
          totalDeltas += delta;
          sampleCount++;
        }
      };

      addPattern(10, 10); // 100ms
      addPattern(5, 50); // 250ms (total 350ms)
      addPattern(15, 20); // 300ms (total 650ms)

      // All samples are within the 1000ms window (t=650)
      expect(w.count).toBe(sampleCount);
      const expectedAvg = totalDeltas / sampleCount; // (100 + 250 + 300) / 30 = 650 / 30 = 21.666...
      expect(w.getAverage(t)).toBeCloseTo(expectedAvg, 4);
    });

    it("safely handles capacity exhaustion by explicitly invalidating the window (Fail-Safe), never silently shrinking", () => {
      // Create a tiny capacity for testing
      const w = new AQCRollingWindow(5);

      // Add 5 samples (fill capacity) within 1000ms
      w.addSample(10, 10);
      w.addSample(20, 10);
      w.addSample(30, 10);
      w.addSample(40, 10);
      w.addSample(50, 10);

      expect(w.count).toBe(5);
      expect(w.isWindowPrimed(1050)).toBe(true); // Primed at t=1050

      // The 6th sample exceeds capacity within 1000ms.
      // It must NOT silently evict the oldest sample, as that would redefine the window to be the last 5 samples instead of the last 1000ms.
      // Instead, it must explicitly fail and invalidate the window by clearing history.
      w.addSample(60, 10);

      // The window is now reset and begins accumulating from the overflowing sample
      expect(w.count).toBe(1); // Only the 6th sample remains
      expect(w.sum).toBe(10);
      expect(w.isWindowPrimed(60)).toBe(false); // Window is explicitly unprimed
      expect(w.isWindowPrimed(1050)).toBe(false); // At t=1050, it is still unprimed because firstTimestamp is now 60 (1050 - 60 = 990 < 1000)
    });

    it("tests the 3-second continuous dwell boundary exactly (AQC_DWELL_INVARIANT)", () => {
      const w = new AQCRollingWindow();
      const threshold = 33.33;

      // Degraded for 2,999ms
      let demote = w.updateDwell(2999, 40.0, threshold);
      expect(demote).toBe(false);
      expect(w.continuousDwellMs).toBe(2999);

      // 1 more ms pushes it to 3,000ms -> should demote
      demote = w.updateDwell(1, 40.0, threshold);
      expect(demote).toBe(true);
      expect(w.continuousDwellMs).toBe(3000);
    });

    it("resets continuous dwell exactly upon a single good frame", () => {
      const w = new AQCRollingWindow();
      const threshold = 33.33;

      // Degraded for 2000ms
      w.updateDwell(2000, 40.0, threshold);
      expect(w.continuousDwellMs).toBe(2000);

      // 1 good frame (avg < threshold)
      w.updateDwell(16.6, 16.6, threshold);
      expect(w.continuousDwellMs).toBe(0); // Reset!

      // Degraded again for 1500ms
      const demote = w.updateDwell(1500, 40.0, threshold);
      expect(demote).toBe(false);
      expect(w.continuousDwellMs).toBe(1500); // Does NOT accumulate with the previous 2000
    });
  });
});
