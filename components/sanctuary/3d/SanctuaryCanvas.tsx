"use client";

import React, { useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { Canvas } from "@react-three/fiber";
import { useRouter } from "next/navigation";
import type { MemorySummary } from "@/lib/data/memories";
import type { SpatialMemoryData } from "./state/sanctuary3d.types";
import { useSanctuary3DStore } from "./state/sanctuary3d.store";
import { SanctuaryScene } from "./SanctuaryScene";
import { WebGLErrorFallback } from "./WebGLErrorFallback";

export function checkWebGLSupport(): { supported: boolean; reason?: string } {
  if (typeof window === "undefined") {
    return { supported: false, reason: "Server rendering" };
  }
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl");
    if (!gl) {
      return {
        supported: false,
        reason:
          "Hardware acceleration or WebGL is disabled or unsupported in this browser environment.",
      };
    }
    return { supported: true };
  } catch (err) {
    return {
      supported: false,
      reason:
        err instanceof Error
          ? err.message
          : "WebGL context initialization error",
    };
  }
}

function subscribeReducedMotion(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  mediaQuery.addEventListener("change", callback);
  return () => mediaQuery.removeEventListener("change", callback);
}

function getReducedMotionSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getReducedMotionServerSnapshot(): boolean {
  return false;
}

export function computeSpatialPositions(
  memories: MemorySummary[]
): SpatialMemoryData[] {
  const count = memories.length;
  if (count === 0) return [];

  const radius = Math.min(9, Math.max(5, count * 0.65));

  return memories.map((m, index) => {
    // Arrange in a circle around origin
    const angle = (index / count) * Math.PI * 2 - Math.PI / 2;
    const y = 0.2 + ((index % 3) - 1) * 0.25;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;

    return {
      id: m.id,
      kind: m.kind,
      title: m.title,
      description: m.description,
      memoryDate: m.memoryDate,
      emotion: m.emotion,
      isFavorite: m.isFavorite,
      position: [x, y, z] as [number, number, number],
    };
  });
}

interface SanctuaryCanvasProps {
  memories: MemorySummary[];
  onExitTo2D: () => void;
}

export function SanctuaryCanvas({
  memories,
  onExitTo2D,
}: SanctuaryCanvasProps) {
  const router = useRouter();
  const {
    view,
    setWebGLUnavailable,
    handleContextLost,
    handleContextRestored,
    enter3D,
  } = useSanctuary3DStore();

  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  );

  const containerRef = useRef<HTMLDivElement>(null);

  // WebGL capability check before mounting Canvas
  useEffect(() => {
    const check = checkWebGLSupport();
    if (!check.supported) {
      setWebGLUnavailable(check.reason);
    }
  }, [setWebGLUnavailable]);

  // Context-loss event listeners on canvas container
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleLost = (e: Event) => {
      e.preventDefault();
      handleContextLost();
    };

    const handleRestored = () => {
      handleContextRestored();
    };

    container.addEventListener("webglcontextlost", handleLost, true);
    container.addEventListener("webglcontextrestored", handleRestored, true);

    return () => {
      container.removeEventListener("webglcontextlost", handleLost, true);
      container.removeEventListener("webglcontextrestored", handleRestored, true);
    };
  }, [handleContextLost, handleContextRestored]);

  // Transform safe domain projections to procedural coordinates
  const spatialMemories = useMemo(
    () => computeSpatialPositions(memories),
    [memories]
  );

  const handleNavigate = (id: string) => {
    router.push(`/memory/${id}`);
  };

  if (view.state === "3D_FALLBACK") {
    return (
      <WebGLErrorFallback
        errorMessage={view.errorMessage}
        circuitBreakerTripped={view.circuitBreakerTripped}
        onReturnTo2D={onExitTo2D}
        onRetry={
          view.circuitBreakerTripped
            ? undefined
            : () => {
                enter3D();
              }
        }
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[620px] rounded-2xl overflow-hidden border border-background-border/80 bg-[#050811] shadow-2xl"
    >
      {/* Visual Canvas has aria-hidden=true because semantic DOM navigation provides the accessible tree */}
      <Canvas
        aria-hidden="true"
        gl={{
          antialias: true,
          powerPreference: "default",
        }}
        camera={{ position: [0, 5, 14], fov: 50 }}
      >
        <SanctuaryScene
          memories={spatialMemories}
          reducedMotion={reducedMotion}
          onNavigate={handleNavigate}
        />
      </Canvas>

      {/* Spatial HUD Overlay */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={onExitTo2D}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background-surface/80 hover:bg-background-elevated border border-background-border/80 text-xs text-gray-200 font-medium transition-colors backdrop-blur-md focus-visible:ring-2 focus-visible:ring-primary shadow"
          >
            &larr; Return to 2D Archive
          </button>
          <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-md bg-sky-950/60 border border-sky-800/40 text-[11px] font-mono text-sky-400">
            3D Sanctuary &bull; Level II
          </span>
        </div>

        {reducedMotion && (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-amber-950/60 border border-amber-800/40 text-[11px] font-mono text-amber-300">
            Reduced Motion Mode
          </span>
        )}
      </div>

      {/* Degraded State Recovery Banner */}
      {view.state === "3D_DEGRADED" && (
        <div
          role="status"
          aria-live="polite"
          className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-amber-950/90 border border-amber-700/80 text-amber-200 px-4 py-2 rounded-lg text-xs font-mono shadow-xl backdrop-blur-md flex items-center gap-2"
        >
          <span className="animate-spin text-sm">⟳</span>
          <span>{view.errorMessage || "Attempting graphics recovery..."}</span>
        </div>
      )}
    </div>
  );
}
