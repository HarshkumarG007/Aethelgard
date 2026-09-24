"use client";

import { useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

interface CameraRigProps {
  target: { kind: string; position: [number, number, number] };
  reducedMotion: boolean;
}

const DEFAULT_CAMERA_POS = new THREE.Vector3(0, 9, 20);
const DEFAULT_LOOK_AT = new THREE.Vector3(0, 0, 0);
const CAMERA_SAFE_BOUNDS_R = 55;

export function CameraRig({ target, reducedMotion }: CameraRigProps) {
  const currentLookAt = useRef(new THREE.Vector3(0, 0, 0));

  const targetLookAt = useMemo(() => {
    if (target.kind === "archipelago") {
      return DEFAULT_LOOK_AT;
    }
    return new THREE.Vector3(...target.position);
  }, [target]);

  const targetCameraPos = useMemo(() => {
    if (target.kind === "archipelago") {
      return DEFAULT_CAMERA_POS;
    }

    const [x, y, z] = target.position;
    const dir = new THREE.Vector3(x, 0, z).normalize();
    if (dir.lengthSq() < 0.001) dir.set(0, 0, 1);

    const offsetMagnitude = target.kind === "chapter" ? 14 : 4.5;
    const heightOffset = target.kind === "chapter" ? 6 : 1.2;

    const proposedX = x + dir.x * offsetMagnitude;
    const proposedZ = z + dir.z * offsetMagnitude;

    // Clamp camera position to SAFE_BOUNDS
    const distSq = proposedX * proposedX + proposedZ * proposedZ;
    let finalX = proposedX;
    let finalZ = proposedZ;
    
    if (distSq > CAMERA_SAFE_BOUNDS_R * CAMERA_SAFE_BOUNDS_R) {
      const dist = Math.sqrt(distSq);
      const scale = CAMERA_SAFE_BOUNDS_R / dist;
      finalX *= scale;
      finalZ *= scale;
    }

    return new THREE.Vector3(finalX, y + heightOffset, finalZ);
  }, [target]);

  useFrame((state, delta) => {
    const cam = state.camera;
    if (!cam) return;

    if (reducedMotion) {
      // Instantaneous placement: zero interpolation or camera lag
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
