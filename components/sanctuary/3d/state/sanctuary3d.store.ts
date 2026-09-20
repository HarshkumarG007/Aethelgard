"use client";

import { create } from "zustand";
import type {
  ArtifactContext,
  ArtifactEvent,
  QualityContext,
  QualityEvent,
  ViewContext,
  ViewEvent,
} from "./sanctuary3d.types";
import {
  INITIAL_ARTIFACT_CONTEXT,
  INITIAL_QUALITY_CONTEXT,
  INITIAL_VIEW_CONTEXT,
  transitionArtifact,
  transitionQuality,
  transitionView,
} from "./sanctuary3d.machine";

export interface Sanctuary3DStore {
  // Artifact presentation state machine
  artifact: ArtifactContext;
  dispatchArtifact: (event: ArtifactEvent) => void;
  hoverEnter: (id: string) => void;
  hoverLeave: (id: string) => void;
  focusArtifact: (id: string) => void;
  activateArtifact: (id: string) => void;
  escapeArtifact: () => void;
  resetArtifact: () => void;

  // Spatial view lifecycle state machine
  view: ViewContext;
  dispatchView: (event: ViewEvent) => void;
  enter3D: () => void;
  exitTo2D: () => void;
  setSceneReady: () => void;
  setWebGLUnavailable: (reason?: string) => void;
  handleContextLost: () => void;
  handleContextRestored: () => void;
  handleRecoveryFailed: (reason?: string) => void;
  resetView: () => void;

  // Adaptive quality lifecycle state machine
  quality: QualityContext;
  dispatchQuality: (event: QualityEvent) => void;
  samplePerformance: (avgDeltaMs: number, elapsedMs: number) => void;
  stepDownQuality: () => void;
  resetQuality: () => void;
}

export const useSanctuary3DStore = create<Sanctuary3DStore>((set) => ({
  artifact: { ...INITIAL_ARTIFACT_CONTEXT },
  dispatchArtifact: (event) =>
    set((state) => ({
      artifact: transitionArtifact(state.artifact, event),
    })),
  hoverEnter: (id) =>
    set((state) => ({
      artifact: transitionArtifact(state.artifact, { type: "POINTER_ENTER", id }),
    })),
  hoverLeave: (id) =>
    set((state) => ({
      artifact: transitionArtifact(state.artifact, { type: "POINTER_LEAVE", id }),
    })),
  focusArtifact: (id) =>
    set((state) => ({
      artifact: transitionArtifact(state.artifact, { type: "FOCUS", id }),
    })),
  activateArtifact: (id) =>
    set((state) => ({
      artifact: transitionArtifact(state.artifact, { type: "ACTIVATE", id }),
    })),
  escapeArtifact: () =>
    set((state) => ({
      artifact: transitionArtifact(state.artifact, { type: "ESCAPE" }),
    })),
  resetArtifact: () =>
    set((state) => ({
      artifact: transitionArtifact(state.artifact, { type: "RESET" }),
    })),

  view: { ...INITIAL_VIEW_CONTEXT },
  dispatchView: (event) =>
    set((state) => ({
      view: transitionView(state.view, event),
    })),
  enter3D: () =>
    set((state) => ({
      view: transitionView(state.view, { type: "ENTER_3D" }),
    })),
  exitTo2D: () =>
    set((state) => ({
      view: transitionView(state.view, { type: "EXIT_TO_2D" }),
      artifact: transitionArtifact(state.artifact, { type: "RESET" }),
      quality: { ...INITIAL_QUALITY_CONTEXT },
    })),
  setSceneReady: () =>
    set((state) => ({
      view: transitionView(state.view, { type: "SCENE_READY" }),
    })),
  setWebGLUnavailable: (reason) =>
    set((state) => ({
      view: transitionView(state.view, { type: "WEBGL_UNAVAILABLE", reason }),
    })),
  handleContextLost: () =>
    set((state) => ({
      view: transitionView(state.view, { type: "CONTEXT_LOST" }),
    })),
  handleContextRestored: () =>
    set((state) => ({
      view: transitionView(state.view, { type: "CONTEXT_RESTORED" }),
    })),
  handleRecoveryFailed: (reason) =>
    set((state) => ({
      view: transitionView(state.view, { type: "RECOVERY_FAILED", reason }),
    })),
  resetView: () =>
    set((state) => ({
      view: transitionView(state.view, { type: "RESET" }),
      quality: { ...INITIAL_QUALITY_CONTEXT },
    })),

  quality: { ...INITIAL_QUALITY_CONTEXT },
  dispatchQuality: (event) =>
    set((state) => {
      const nextQuality = transitionQuality(state.quality, event);
      if (nextQuality.tier === "EXHAUSTED" && state.quality.tier !== "EXHAUSTED") {
        return {
          quality: nextQuality,
          view: transitionView(state.view, { type: "QUALITY_EXHAUSTED" }),
        };
      }
      return { quality: nextQuality };
    }),
  samplePerformance: (avgDeltaMs, elapsedMs) =>
    set((state) => {
      const nextQuality = transitionQuality(state.quality, {
        type: "PERF_SAMPLE",
        avgDeltaMs,
        elapsedMs,
      });
      if (nextQuality.tier === "EXHAUSTED" && state.quality.tier !== "EXHAUSTED") {
        return {
          quality: nextQuality,
          view: transitionView(state.view, { type: "QUALITY_EXHAUSTED" }),
        };
      }
      return { quality: nextQuality };
    }),
  stepDownQuality: () =>
    set((state) => {
      const nextQuality = transitionQuality(state.quality, { type: "STEP_DOWN" });
      if (nextQuality.tier === "EXHAUSTED" && state.quality.tier !== "EXHAUSTED") {
        return {
          quality: nextQuality,
          view: transitionView(state.view, { type: "QUALITY_EXHAUSTED" }),
        };
      }
      return { quality: nextQuality };
    }),
  resetQuality: () =>
    set(() => ({
      quality: { ...INITIAL_QUALITY_CONTEXT },
    })),
}));
