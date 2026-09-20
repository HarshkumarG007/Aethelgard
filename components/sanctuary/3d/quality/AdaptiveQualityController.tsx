"use client";

import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useSanctuary3DStore } from "../state/sanctuary3d.store";
import {
  TIER_THRESHOLDS_MS,
  DWELL_DURATION_MS,
} from "../state/sanctuary3d.machine";
import type { QualityTier } from "../state/sanctuary3d.types";

// Explicit supported observation-rate ceiling: 240 Hz
// At 240 Hz, exactly 240 frames occur in 1,000ms.
// Buffer capacity is oversized to 300 to provide a generous margin for micro-stutters and timer jitter.
const AQC_MAX_CAPACITY = 300;

/**
 * Pure state container for the AQC Rolling Window.
 * Extracted to allow deterministic, mathematical testing of the temporal window
 * independently of React/WebGL requestAnimationFrame loops.
 */
export class AQCRollingWindow {
  timestamps: Float64Array;
  deltas: Float32Array;
  head: number = 0;
  tail: number = 0;
  count: number = 0;
  sum: number = 0;
  continuousDwellMs: number = 0;
  capacity: number;
  lastTimestamp: number = 0;
  firstTimestamp: number | null = null;

  constructor(capacity: number = AQC_MAX_CAPACITY) {
    this.capacity = capacity;
    this.timestamps = new Float64Array(capacity);
    this.deltas = new Float32Array(capacity);
  }

  addSample(now: number, deltaMs: number): void {
    if (this.firstTimestamp === null) {
      this.firstTimestamp = now;
    }

    // AQC_ROLLING_WINDOW_INVARIANT: Evict samples older than (now - 1000ms)
    // The window is strictly (now - 1000ms, now]. Any sample with timestamp <= now - 1000 is excluded.
    while (this.count > 0 && this.timestamps[this.tail] <= now - 1000) {
      this.sum -= this.deltas[this.tail];
      this.tail = (this.tail + 1) % this.capacity;
      this.count--;
    }

    // Capacity Safeguard / Overflow Detection
    if (this.count === this.capacity) {
      // The buffer is completely full, and all samples are STRICTLY within the last 1000ms.
      // This means the hardware is running faster than our defined observation-rate ceiling.
      // We cannot silently drop the oldest sample because that changes the mathematical meaning
      // of the window from "last 1000ms" to "last N samples".
      // FAIL SAFE: Explicitly invalidate the window, wait for a fresh 1000ms to accumulate.
      this.head = 0;
      this.tail = 0;
      this.count = 0;
      this.sum = 0;
      this.continuousDwellMs = 0;
      this.firstTimestamp = now;
    }

    // Append new sample
    this.timestamps[this.head] = now;
    this.deltas[this.head] = deltaMs;
    this.sum += deltaMs;
    this.head = (this.head + 1) % this.capacity;
    this.count++;
  }

  /**
   * Partial-window startup guard:
   * Demotion evaluation must only occur once the rolling history covers a full 1,000ms,
   * preventing premature downgrade on initial scene startup.
   */
  isWindowPrimed(now: number): boolean {
    if (this.count === 0 || this.firstTimestamp === null) return false;
    return now - this.firstTimestamp >= 1000;
  }

  getAverage(now?: number): number | null {
    if (now !== undefined) {
      while (this.count > 0 && this.timestamps[this.tail] <= now - 1000) {
        this.sum -= this.deltas[this.tail];
        this.tail = (this.tail + 1) % this.capacity;
        this.count--;
      }
    }
    if (this.count === 0) return null;
    return this.sum / this.count;
  }

  updateDwell(deltaMs: number, avgDeltaMs: number, threshold: number): boolean {
    if (avgDeltaMs > threshold) {
      this.continuousDwellMs += deltaMs;
      return this.continuousDwellMs >= DWELL_DURATION_MS;
    } else {
      this.continuousDwellMs = 0;
      return false;
    }
  }

  resetAll(): void {
    this.head = 0;
    this.tail = 0;
    this.count = 0;
    this.sum = 0;
    this.continuousDwellMs = 0;
    this.firstTimestamp = null;
    this.lastTimestamp = 0;
  }
}

/**
 * Adaptive Quality Controller (AQC):
 *
 * GUARANTEED INVARIANTS:
 * 1. Zero allocations inside useFrame: Pre-allocated Float64/32Array ring buffer.
 *    No array spread, no array slice, no filter, no object instantiation per frame.
 * 2. Zero per-frame React state updates: Updates occur strictly upon tier demotion.
 * 3. High-resolution timing: Strictly uses performance.now() (never Date.now()).
 * 4. Monotonicity: Upward promotion is strictly prohibited.
 * 5. Tier 0 Decoupling: Upon reaching EXHAUSTED, emits QUALITY_EXHAUSTED to SpatialViewMachine,
 *    which safely unmounts the canvas at the DOM layer without crashing.
 *
 * AQC_ROLLING_WINDOW_INVARIANT:
 * At every observation time t, the rolling metric contains exactly the samples whose
 * timestamps fall within the defined 1,000 ms window (now - 1000ms, now], independent of refresh rate.
 *
 * Capacity Safeguard:
 * Capacity (300) is merely an implementation safeguard and must not dictate temporal correctness.
 * Capacity exhaustion must fail safely.
 *
 * AQC_DWELL_INVARIANT:
 * A quality downgrade may occur only when the degradation predicate remains continuously
 * true for >= 3000ms. A single good frame will reset the continuous dwell.
 */
export function AdaptiveQualityController() {
  const { quality, stepDownQuality } = useSanctuary3DStore();

  const currentTierRef = useRef<QualityTier>(quality.tier);
  useEffect(() => {
    currentTierRef.current = quality.tier;
  }, [quality.tier]);

  const windowRef = useRef<AQCRollingWindow>(
    new AQCRollingWindow(AQC_MAX_CAPACITY),
  );

  useFrame(() => {
    const currentTier = currentTierRef.current;
    if (currentTier === "EXHAUSTED") return;

    const w = windowRef.current;
    const now = performance.now();

    if (w.lastTimestamp === 0) {
      w.lastTimestamp = now;
      return;
    }

    const deltaMs = now - w.lastTimestamp;
    w.lastTimestamp = now;

    // Ignore background tab freezes or massive stalls
    if (deltaMs > 300) {
      return;
    }

    w.addSample(now, deltaMs);

    // Partial-window startup guard: require 1,000ms history before evaluating demotion
    if (!w.isWindowPrimed(now)) {
      return;
    }

    const avgDeltaMs = w.getAverage(now);
    if (avgDeltaMs === null) {
      return;
    }

    const threshold = TIER_THRESHOLDS_MS[currentTier];
    const shouldDemote = w.updateDwell(deltaMs, avgDeltaMs, threshold);

    if (shouldDemote) {
      w.resetAll();
      stepDownQuality();
    }
  });

  return null;
}
