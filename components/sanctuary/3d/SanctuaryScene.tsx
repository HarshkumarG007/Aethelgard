"use client";

import React, { useEffect, useMemo } from "react";
import * as THREE from "three";
import type { SpatialMemoryData } from "./state/sanctuary3d.types";
import { useSanctuary3DStore } from "./state/sanctuary3d.store";
import { MemoryArtifact } from "./MemoryArtifact";
import { CameraRig } from "./CameraRig";

interface SanctuarySceneProps {
  memories: SpatialMemoryData[];
  reducedMotion: boolean;
  onNavigate: (id: string) => void;
}

export function SanctuaryScene({
  memories,
  reducedMotion,
  onNavigate,
}: SanctuarySceneProps) {
  const { setSceneReady } = useSanctuary3DStore();

  useEffect(() => {
    setSceneReady();
  }, [setSceneReady]);

  // Procedural dais ground ring
  const daisGeometry = useMemo(
    () => new THREE.CylinderGeometry(14, 14.5, 0.2, 48),
    []
  );

  const daisMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#0f172a",
        roughness: 0.8,
        metalness: 0.1,
      }),
    []
  );

  // Dais ring marker
  const ringGeometry = useMemo(
    () => new THREE.RingGeometry(13.8, 14.2, 64),
    []
  );

  const ringMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#1e293b",
        side: THREE.DoubleSide,
      }),
    []
  );

  useEffect(() => {
    return () => {
      daisGeometry.dispose();
      daisMaterial.dispose();
      ringGeometry.dispose();
      ringMaterial.dispose();
    };
  }, [daisGeometry, daisMaterial, ringGeometry, ringMaterial]);

  return (
    <>
      <color attach="background" args={["#050811"]} />
      <fog attach="fog" args={["#050811", 10, 32]} />

      {/* Cinematic Sanctuary Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[8, 12, 10]}
        intensity={0.8}
        color="#f8fafc"
      />
      <pointLight position={[0, 4, 0]} intensity={0.5} color="#38bdf8" />

      {/* Procedural Dais */}
      <mesh
        geometry={daisGeometry}
        material={daisMaterial}
        position={[0, -0.6, 0]}
      />
      <mesh
        geometry={ringGeometry}
        material={ringMaterial}
        position={[0, -0.49, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      />

      {/* Camera Rig */}
      <CameraRig memories={memories} reducedMotion={reducedMotion} />

      {/* Procedural Memory Artifacts */}
      {memories.map((mem) => (
        <MemoryArtifact
          key={mem.id}
          memory={mem}
          reducedMotion={reducedMotion}
          onNavigate={onNavigate}
        />
      ))}
    </>
  );
}
