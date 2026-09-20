"use client";

import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useSanctuary3DStore } from "../state/sanctuary3d.store";
import { TIER_THRESHOLDS_MS, DWELL_DURATION_MS } from "../state/sanctuary3d.machine";
import type { QualityTier } from "../state/sanctuary3d.types";

const RING_BUFFER_SIZE = 60; // 60 frames rolling sample window

interface RingBufferState {
  samples: Float32Array;
  head: number;
  count: number;
  sum: number;
  lastTimestamp: number;
  continuousDwellMs: number;
}

/**
 * Adaptive Quality Controller (AQC):
 *
 * GUARANTEED INVARIANTS:
 * 1. Zero allocations inside useFrame: Pre-allocated Float32Array ring buffer.
 *    No array spread, no array slice, no filter, no object instantiation per frame.
 * 2. Zero per-frame React state updates: Updates occur strictly upon tier demotion.
 * 3. High-resolution timing: Strictly uses performance.now() (never Date.now()).
 * 4. Monotonicity: Upward promotion is strictly prohibited.
 * 5. Hysteresis & Cancellation: If average frame time recovers before DWELL_DURATION_MS (3000ms),
 *    the dwell timer cancels and resets to 0ms immediately.
 * 6. Tier 0 Decoupling: Upon reaching EXHAUSTED, emits QUALITY_EXHAUSTED to SpatialViewMachine,
 *    which safely unmounts the canvas at the DOM layer without crashing.
 */
export function AdaptiveQualityController() {
  const { quality, stepDownQuality } = useSanctuary3DStore();

  const currentTierRef = useRef<QualityTier>(quality.tier);
  useEffect(() => {
    currentTierRef.current = quality.tier;
  }, [quality.tier]);

  const stateRef = useRef<RingBufferState>({
    samples: new Float32Array(RING_BUFFER_SIZE),
    head: 0,
    count: 0,
    sum: 0,
    lastTimestamp: 0,
    continuousDwellMs: 0,
  });

  useFrame(() => {
    const currentTier = currentTierRef.current;
    if (currentTier === "EXHAUSTED") return;

    const s = stateRef.current;
    const now = performance.now();

    if (s.lastTimestamp === 0) {
      s.lastTimestamp = now;
      return;
    }

    const deltaMs = now - s.lastTimestamp;
    s.lastTimestamp = now;

    // Ignore background tab freezes or massive stalls
    if (deltaMs > 300) {
      return;
    }

    // Update fixed ring buffer in-place without allocations
    if (s.count === RING_BUFFER_SIZE) {
      s.sum -= s.samples[s.head];
    } else {
      s.count++;
    }

    s.samples[s.head] = deltaMs;
    s.sum += deltaMs;
    s.head = (s.head + 1) % RING_BUFFER_SIZE;

    // Require at least 20 samples before evaluating performance
    if (s.count < 20) {
      return;
    }

    const avgDeltaMs = s.sum / s.count;
    const threshold = TIER_THRESHOLDS_MS[currentTier];

    if (avgDeltaMs > threshold) {
      s.continuousDwellMs += deltaMs;
      if (s.continuousDwellMs >= DWELL_DURATION_MS) {
        // Step down tier monotonically
        s.continuousDwellMs = 0;
        s.count = 0;
        s.sum = 0;
        s.head = 0;
        stepDownQuality();
      }
    } else {
      // Performance recovered before dwell threshold: reset dwell timer
      if (s.continuousDwellMs > 0) {
        s.continuousDwellMs = 0;
      }
    }
  });

  return null;
}
