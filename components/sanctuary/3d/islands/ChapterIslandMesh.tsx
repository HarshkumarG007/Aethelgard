"use client";

import React, { useRef, useMemo, useEffect } from "react";
import * as THREE from "three";
import { useSanctuary3DStore } from "../state/sanctuary3d.store";

interface IslandData {
  chapterId: string;
  title: string;
  center: [number, number, number];
  radius: number;
}

interface ChapterIslandMeshProps {
  islands: IslandData[];
}

const BASE_RADIUS = 5.5;

export function ChapterIslandMesh({ islands }: ChapterIslandMeshProps) {
  const daisMeshRef = useRef<THREE.InstancedMesh>(null);
  const ringMeshRef = useRef<THREE.InstancedMesh>(null);

  const islandCount = Math.max(1, islands.length);

  // Shared geometry for all island bases (instanced)
  const daisGeometry = useMemo(
    () => new THREE.CylinderGeometry(BASE_RADIUS, BASE_RADIUS * 1.03, 0.25, 36),
    []
  );

  const daisMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#0f172a",
        roughness: 0.85,
        metalness: 0.15,
      }),
    []
  );

  // Shared ring trim geometry (instanced)
  const ringGeometry = useMemo(
    () => new THREE.RingGeometry(BASE_RADIUS * 0.95, BASE_RADIUS, 36),
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

  // Populate instanced matrices
  useEffect(() => {
    const dummy = new THREE.Object3D();
    const islandsToRender =
      islands.length > 0
        ? islands
        : [{ chapterId: "origin", title: "Origin Dais", center: [0, 0, 0] as [number, number, number], radius: BASE_RADIUS }];

    for (let i = 0; i < islandsToRender.length; i++) {
      const island = islandsToRender[i];
      const scale = island.radius / BASE_RADIUS;

      // Dais base instance
      if (daisMeshRef.current) {
        dummy.position.set(island.center[0], island.center[1] - 0.6, island.center[2]);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(scale, 1, scale);
        dummy.updateMatrix();
        daisMeshRef.current.setMatrixAt(i, dummy.matrix);
      }

      // Dais ring trim instance
      if (ringMeshRef.current) {
        dummy.position.set(island.center[0], island.center[1] - 0.47, island.center[2]);
        dummy.rotation.set(-Math.PI / 2, 0, 0);
        dummy.scale.set(scale, scale, 1);
        dummy.updateMatrix();
        ringMeshRef.current.setMatrixAt(i, dummy.matrix);
      }
    }

    if (daisMeshRef.current) {
      daisMeshRef.current.instanceMatrix.needsUpdate = true;
    }
    if (ringMeshRef.current) {
      ringMeshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [islands]);

  const { focusChapter } = useSanctuary3DStore();
  const TOUCH_MOVE_CANCEL_THRESHOLD_PX = 100; // 10px squared
  const pointerDownPos = useRef<{ x: number; y: number } | null>(null);

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    pointerDownPos.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: any) => {
    e.stopPropagation();
    if (!pointerDownPos.current) return;

    const dx = e.clientX - pointerDownPos.current.x;
    const dy = e.clientY - pointerDownPos.current.y;
    const distSq = dx * dx + dy * dy;

    pointerDownPos.current = null; // reset

    if (distSq > TOUCH_MOVE_CANCEL_THRESHOLD_PX) {
      return;
    }

    if (e.instanceId !== undefined && islands[e.instanceId]) {
      const island = islands[e.instanceId];
      if (island.chapterId !== "origin") {
        focusChapter(island.chapterId);
      }
    }
  };

  // Deterministic GPU disposal
  useEffect(() => {
    return () => {
      daisGeometry.dispose();
      daisMaterial.dispose();
      ringGeometry.dispose();
      ringMaterial.dispose();
    };
  }, [daisGeometry, daisMaterial, ringGeometry, ringMaterial]);

  return (
    <group name="chapter-archipelago-islands">
      <instancedMesh
        ref={daisMeshRef}
        args={[daisGeometry, daisMaterial, islandCount]}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      />
      <instancedMesh
        ref={ringMeshRef}
        args={[ringGeometry, ringMaterial, islandCount]}
      />
    </group>
  );
}
