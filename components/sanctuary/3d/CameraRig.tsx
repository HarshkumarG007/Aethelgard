"use client";

import { useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import type { SpatialMemoryData } from "./state/sanctuary3d.types";
import { useSanctuary3DStore } from "./state/sanctuary3d.store";

interface CameraRigProps {
  memories: SpatialMemoryData[];
  reducedMotion: boolean;
}

const DEFAULT_CAMERA_POS = new THREE.Vector3(0, 5, 14);
const DEFAULT_LOOK_AT = new THREE.Vector3(0, 0, 0);

export function CameraRig({ memories, reducedMotion }: CameraRigProps) {
  const currentLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const { artifact } = useSanctuary3DStore();

  // Find targeted memory position
  const activeMemory = useMemo(() => {
    if (!artifact.activeId) return null;
    return memories.find((m) => m.id === artifact.activeId) || null;
  }, [artifact.activeId, memories]);

  const targetCameraPos = useMemo(() => {
    if (!activeMemory) {
      return DEFAULT_CAMERA_POS;
    }
    const [x, y, z] = activeMemory.position;
    // Position camera facing the artifact slightly above and offset
    const dir = new THREE.Vector3(x, 0, z).normalize();
    if (dir.lengthSq() < 0.001) dir.set(0, 0, 1);
    return new THREE.Vector3(x + dir.x * 4, y + 1.2, z + dir.z * 4);
  }, [activeMemory]);

  const targetLookAt = useMemo(() => {
    if (!activeMemory) {
      return DEFAULT_LOOK_AT;
    }
    const [x, y, z] = activeMemory.position;
    return new THREE.Vector3(x, y, z);
  }, [activeMemory]);

  useFrame((state, delta) => {
    const cam = state.camera;
    if (!cam) return;

    if (reducedMotion) {
      // Instantaneous placement: zero interpolation
      cam.position.copy(targetCameraPos);
      currentLookAt.current.copy(targetLookAt);
      cam.lookAt(currentLookAt.current);
      return;
    }

    // Smooth subtle camera damping
    cam.position.x = THREE.MathUtils.damp(
      cam.position.x,
      targetCameraPos.x,
      4,
      delta
    );
    cam.position.y = THREE.MathUtils.damp(
      cam.position.y,
      targetCameraPos.y,
      4,
      delta
    );
    cam.position.z = THREE.MathUtils.damp(
      cam.position.z,
      targetCameraPos.z,
      4,
      delta
    );

    currentLookAt.current.x = THREE.MathUtils.damp(
      currentLookAt.current.x,
      targetLookAt.x,
      4,
      delta
    );
    currentLookAt.current.y = THREE.MathUtils.damp(
      currentLookAt.current.y,
      targetLookAt.y,
      4,
      delta
    );
    currentLookAt.current.z = THREE.MathUtils.damp(
      currentLookAt.current.z,
      targetLookAt.z,
      4,
      delta
    );

    cam.lookAt(currentLookAt.current);
  });

  return null;
}
