"use client";

import React, { useEffect, useMemo } from "react";
import type { MemorySummary } from "@/lib/data/memories";
import type { ChapterSummary } from "@/lib/data/chapters";
import type { SpatialMemoryData } from "./state/sanctuary3d.types";
import { useSanctuary3DStore } from "./state/sanctuary3d.store";
import { computeArchipelagoLayout } from "./islands/ArchipelagoLayout";
import { ChapterIslandMesh } from "./islands/ChapterIslandMesh";
import { InstancedMemoryArtifacts } from "./InstancedMemoryArtifacts";
import { MemoryArtifact } from "./MemoryArtifact";
import { AtmosphericMotes } from "./shaders/atmosphericMotes";
import { AdaptiveQualityController } from "./quality/AdaptiveQualityController";
import { CameraRig } from "./CameraRig";

interface SanctuarySceneProps {
  memories: MemorySummary[];
  chapters?: ChapterSummary[];
  reducedMotion: boolean;
  onNavigate: (id: string) => void;
}

export function SanctuaryScene({
  memories,
  chapters = [],
  reducedMotion,
  onNavigate,
}: SanctuarySceneProps) {
  const { setSceneReady, artifact, quality } = useSanctuary3DStore();

  useEffect(() => {
    setSceneReady();
  }, [setSceneReady]);

  // Compute pure deterministic archipelago layout
  const layout = useMemo(
    () => computeArchipelagoLayout(chapters, memories),
    [chapters, memories]
  );

  // Map memory summary dictionary for O(1) attribute lookup
  const memoryLookup = useMemo(() => {
    const map = new Map<string, MemorySummary>();
    for (const m of memories) {
      map.set(m.id, m);
    }
    return map;
  }, [memories]);

  // Partition memories into Focused, Proximate, and Distant sets
  const { focusedData, proximateData, distantData } = useMemo(() => {
    const activeId = artifact.activeId;
    let focused: SpatialMemoryData | null = null;
    const proximate: SpatialMemoryData[] = [];
    const distant: SpatialMemoryData[] = [];

    // Identify active island if any
    const activeLayoutItem = activeId
      ? layout.memories.find((m) => m.id === activeId)
      : null;
    const activeChapterId = activeLayoutItem?.chapterId ?? null;

    for (const item of layout.memories) {
      const summary = memoryLookup.get(item.id);
      const spatialData: SpatialMemoryData = {
        id: item.id,
        kind: item.kind,
        title: summary?.title || "Memory",
        description: summary?.description || null,
        memoryDate: summary?.memoryDate || null,
        emotion: summary?.emotion || null,
        isFavorite: summary?.isFavorite || false,
        position: item.worldPosition,
      };

      // Exclude from 3D if outside render volume (|X| or |Z| > 50)
      const distSq =
        item.worldPosition[0] * item.worldPosition[0] +
        item.worldPosition[2] * item.worldPosition[2];
      if (distSq > 50 * 50) {
        continue;
      }

      if (activeId && item.id === activeId) {
        focused = spatialData;
      } else if (
        activeChapterId !== null &&
        item.chapterId === activeChapterId &&
        proximate.length < 5
      ) {
        proximate.push(spatialData);
      } else {
        distant.push(spatialData);
      }
    }

    return {
      focusedData: focused,
      proximateData: proximate,
      distantData: distant,
    };
  }, [layout.memories, memoryLookup, artifact.activeId]);

  return (
    <>
      <color attach="background" args={["#050811"]} />
      <fog attach="fog" args={["#050811", 16, 48]} />

      {/* Cinematic Lighting Pipeline: Shadows STRICTLY DISABLED to maintain draw call and GPU budget */}
      <ambientLight intensity={0.45} />
      <directionalLight
        position={[8, 14, 10]}
        intensity={0.85}
        color="#f8fafc"
        castShadow={false}
      />
      <pointLight
        position={[0, 4, 0]}
        intensity={0.45}
        color="#38bdf8"
        castShadow={false}
      />

      {/* Archipelago Chapter Islands (Instanced Dais + Rings = 2 Draw Calls) */}
      <ChapterIslandMesh islands={layout.islands} />

      {/* Distant Memory Batches (4 InstancedMesh categories = 4 Draw Calls) */}
      <InstancedMemoryArtifacts
        memories={distantData}
        onNavigate={onNavigate}
      />

      {/* Focused Memory Artifact (1 Mesh = 1 Draw Call with GLSL Fresnel Aura) */}
      {focusedData && (
        <MemoryArtifact
          key={`focused-${focusedData.id}`}
          memory={focusedData}
          reducedMotion={reducedMotion}
          onNavigate={onNavigate}
        />
      )}

      {/* Proximate Memory Artifacts (<= 5 Meshes = <= 5 Draw Calls) */}
      {proximateData.map((mem) => (
        <MemoryArtifact
          key={`proximate-${mem.id}`}
          memory={mem}
          reducedMotion={reducedMotion}
          onNavigate={onNavigate}
        />
      ))}

      {/* Atmospheric Motes (1 Points = 1 Draw Call, scaled by AQC tier) */}
      <AtmosphericMotes
        count={quality.moteCount}
        reducedMotion={reducedMotion}
      />

      {/* Monotonic Adaptive Quality Controller (Non-allocating ring buffer) */}
      <AdaptiveQualityController />

      {/* Archipelago-Aware Camera Rig */}
      <CameraRig
        activePosition={focusedData?.position}
        reducedMotion={reducedMotion}
      />
    </>
  );
}
