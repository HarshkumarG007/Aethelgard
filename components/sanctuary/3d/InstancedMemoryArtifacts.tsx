"use client";

import React, { useRef, useMemo, useEffect } from "react";
import * as THREE from "three";
import { type ThreeEvent } from "@react-three/fiber";
import type { SpatialMemoryData } from "./state/sanctuary3d.types";
import { useSanctuary3DStore } from "./state/sanctuary3d.store";

interface InstancedMemoryArtifactsProps {
  memories: SpatialMemoryData[];
  onNavigate: (id: string) => void;
}

const KIND_COLORS: Record<string, string> = {
  standard: "#0284c7",
  letter: "#9333ea",
  milestone: "#d97706",
  future: "#059669",
};

export function InstancedMemoryArtifacts({
  memories,
  onNavigate,
}: InstancedMemoryArtifactsProps) {
  const { hoverEnter, hoverLeave, focusArtifact, activateArtifact } =
    useSanctuary3DStore();

  const standardMeshRef = useRef<THREE.InstancedMesh>(null);
  const letterMeshRef = useRef<THREE.InstancedMesh>(null);
  const milestoneMeshRef = useRef<THREE.InstancedMesh>(null);
  const futureMeshRef = useRef<THREE.InstancedMesh>(null);

  // Group distant memories by kind
  const grouped = useMemo(() => {
    const standard: SpatialMemoryData[] = [];
    const letter: SpatialMemoryData[] = [];
    const milestone: SpatialMemoryData[] = [];
    const future: SpatialMemoryData[] = [];

    for (const mem of memories) {
      switch (mem.kind) {
        case "letter":
          letter.push(mem);
          break;
        case "milestone":
          milestone.push(mem);
          break;
        case "future":
          future.push(mem);
          break;
        case "standard":
        default:
          standard.push(mem);
          break;
      }
    }

    return { standard, letter, milestone, future };
  }, [memories]);

  // Procedural geometries for the 4 distant classes
  const standardGeom = useMemo(
    () => new THREE.CylinderGeometry(0.5, 0.5, 1.0, 6),
    []
  );
  const letterGeom = useMemo(
    () => new THREE.BoxGeometry(0.8, 1.2, 0.08),
    []
  );
  const milestoneGeom = useMemo(
    () => new THREE.IcosahedronGeometry(0.6, 1),
    []
  );
  const futureGeom = useMemo(
    () => new THREE.TorusGeometry(0.5, 0.1, 16, 24),
    []
  );

  // Shared lightweight material
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        roughness: 0.45,
        metalness: 0.2,
        transparent: true,
        opacity: 0.85,
      }),
    []
  );

  // Update instance matrices and colors for each batch
  useEffect(() => {
    const dummy = new THREE.Object3D();
    const tempColor = new THREE.Color();

    const updateBatch = (
      mesh: THREE.InstancedMesh | null,
      items: SpatialMemoryData[],
      kind: string
    ) => {
      if (!mesh) return;
      const colorHex = KIND_COLORS[kind] || "#0284c7";
      tempColor.set(colorHex);

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        dummy.position.set(
          item.position[0],
          item.position[1],
          item.position[2]
        );
        dummy.rotation.set(0, (i * 0.5) % Math.PI, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();

        mesh.setMatrixAt(i, dummy.matrix);
        mesh.setColorAt(i, tempColor);
      }

      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) {
        mesh.instanceColor.needsUpdate = true;
      }
    };

    updateBatch(standardMeshRef.current, grouped.standard, "standard");
    updateBatch(letterMeshRef.current, grouped.letter, "letter");
    updateBatch(milestoneMeshRef.current, grouped.milestone, "milestone");
    updateBatch(futureMeshRef.current, grouped.future, "future");
  }, [grouped]);

  // Clean disposal on unmount
  useEffect(() => {
    return () => {
      standardGeom.dispose();
      letterGeom.dispose();
      milestoneGeom.dispose();
      futureGeom.dispose();
      material.dispose();
    };
  }, [standardGeom, letterGeom, milestoneGeom, futureGeom, material]);

  const handlePointerOver = (
    e: ThreeEvent<PointerEvent>,
    items: SpatialMemoryData[]
  ) => {
    e.stopPropagation();
    if (e.instanceId !== undefined && items[e.instanceId]) {
      hoverEnter(items[e.instanceId].id);
    }
  };

  const handlePointerOut = (
    e: ThreeEvent<PointerEvent>,
    items: SpatialMemoryData[]
  ) => {
    e.stopPropagation();
    if (e.instanceId !== undefined && items[e.instanceId]) {
      hoverLeave(items[e.instanceId].id);
    }
  };

  const handleClick = (
    e: ThreeEvent<MouseEvent>,
    items: SpatialMemoryData[]
  ) => {
    e.stopPropagation();
    if (e.instanceId !== undefined && items[e.instanceId]) {
      const item = items[e.instanceId];
      focusArtifact(item.id);
      activateArtifact(item.id);
      onNavigate(item.id);
    }
  };

  return (
    <group name="instanced-distant-memories">
      {grouped.standard.length > 0 && (
        <instancedMesh
          ref={standardMeshRef}
          args={[standardGeom, material, grouped.standard.length]}
          onPointerOver={(e) => handlePointerOver(e, grouped.standard)}
          onPointerOut={(e) => handlePointerOut(e, grouped.standard)}
          onClick={(e) => handleClick(e, grouped.standard)}
        />
      )}
      {grouped.letter.length > 0 && (
        <instancedMesh
          ref={letterMeshRef}
          args={[letterGeom, material, grouped.letter.length]}
          onPointerOver={(e) => handlePointerOver(e, grouped.letter)}
          onPointerOut={(e) => handlePointerOut(e, grouped.letter)}
          onClick={(e) => handleClick(e, grouped.letter)}
        />
      )}
      {grouped.milestone.length > 0 && (
        <instancedMesh
          ref={milestoneMeshRef}
          args={[milestoneGeom, material, grouped.milestone.length]}
          onPointerOver={(e) => handlePointerOver(e, grouped.milestone)}
          onPointerOut={(e) => handlePointerOut(e, grouped.milestone)}
          onClick={(e) => handleClick(e, grouped.milestone)}
        />
      )}
      {grouped.future.length > 0 && (
        <instancedMesh
          ref={futureMeshRef}
          args={[futureGeom, material, grouped.future.length]}
          onPointerOver={(e) => handlePointerOver(e, grouped.future)}
          onPointerOut={(e) => handlePointerOut(e, grouped.future)}
          onClick={(e) => handleClick(e, grouped.future)}
        />
      )}
    </group>
  );
}
