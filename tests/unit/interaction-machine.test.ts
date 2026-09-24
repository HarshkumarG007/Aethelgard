import { describe, it, expect } from "vitest";
import { transitionArtifact, INITIAL_ARTIFACT_CONTEXT } from "@/components/sanctuary/3d/state/sanctuary3d.machine";
import type { ArtifactContext } from "@/components/sanctuary/3d/state/sanctuary3d.types";

describe("Artifact State Machine (Phase 3C SpatialFocus Invariant)", () => {
  it("should initialize to DORMANT with no spatial focus", () => {
    expect(INITIAL_ARTIFACT_CONTEXT.state).toBe("DORMANT");
    expect(INITIAL_ARTIFACT_CONTEXT.spatialFocus).toEqual({ kind: "none" });
  });

  it("FOCUS_MEMORY sets state to FOCUSED and updates spatialFocus", () => {
    const next = transitionArtifact(INITIAL_ARTIFACT_CONTEXT, { type: "FOCUS_MEMORY", id: "mem1" });
    expect(next.state).toBe("FOCUSED");
    expect(next.spatialFocus).toEqual({ kind: "memory", memoryId: "mem1" });
  });

  it("FOCUS_CHAPTER sets state to DORMANT and updates spatialFocus", () => {
    const next = transitionArtifact(INITIAL_ARTIFACT_CONTEXT, { type: "FOCUS_CHAPTER", chapterId: "chap1" });
    expect(next.state).toBe("DORMANT");
    expect(next.spatialFocus).toEqual({ kind: "chapter", chapterId: "chap1" });
  });

  it("ACTIVATE_MEMORY transitions to ACTIVE if already focused on that memory", () => {
    const focusedState: ArtifactContext = {
      state: "FOCUSED",
      spatialFocus: { kind: "memory", memoryId: "mem1" },
      hoveredId: null,
    };
    const next = transitionArtifact(focusedState, { type: "ACTIVATE_MEMORY", id: "mem1" });
    expect(next.state).toBe("ACTIVE");
  });

  it("ACTIVATE_MEMORY ignores intent if not focused on that memory", () => {
    const next = transitionArtifact(INITIAL_ARTIFACT_CONTEXT, { type: "ACTIVATE_MEMORY", id: "mem1" });
    expect(next.state).toBe("DORMANT");
  });

  it("ESCAPE from ACTIVE returns to FOCUSED", () => {
    const activeState: ArtifactContext = {
      state: "ACTIVE",
      spatialFocus: { kind: "memory", memoryId: "mem1" },
      hoveredId: null,
    };
    const next = transitionArtifact(activeState, { type: "ESCAPE" });
    expect(next.state).toBe("FOCUSED");
    expect(next.spatialFocus).toEqual({ kind: "memory", memoryId: "mem1" });
  });

  it("ESCAPE from FOCUSED steps down to parent chapter if provided", () => {
    const focusedState: ArtifactContext = {
      state: "FOCUSED",
      spatialFocus: { kind: "memory", memoryId: "mem1" },
      hoveredId: null,
    };
    const next = transitionArtifact(focusedState, { type: "ESCAPE", parentChapterId: "chap1" });
    expect(next.state).toBe("DORMANT");
    expect(next.spatialFocus).toEqual({ kind: "chapter", chapterId: "chap1" });
  });

  it("POINTER_ENTER elevates state to PROXIMATE but doesn't change spatial focus", () => {
    const next = transitionArtifact(INITIAL_ARTIFACT_CONTEXT, { type: "POINTER_ENTER", id: "mem1" });
    expect(next.state).toBe("PROXIMATE");
    expect(next.spatialFocus).toEqual({ kind: "none" });
    expect(next.hoveredId).toBe("mem1");
  });

  it("POINTER_LEAVE returns PROXIMATE to DORMANT", () => {
    const proximateState: ArtifactContext = {
      state: "PROXIMATE",
      spatialFocus: { kind: "none" },
      hoveredId: "mem1",
    };
    const next = transitionArtifact(proximateState, { type: "POINTER_LEAVE", id: "mem1" });
    expect(next.state).toBe("DORMANT");
    expect(next.hoveredId).toBeNull();
  });
});
