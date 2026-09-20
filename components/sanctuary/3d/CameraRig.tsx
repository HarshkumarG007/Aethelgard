"use client";

import { useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

interface CameraRigProps {
  activePosition?: [number, number, number] | null;
  reducedMotion: boolean;
}

const DEFAULT_CAMERA_POS = new THREE.Vector3(0, 9, 20);
const DEFAULT_LOOK_AT = new THREE.Vector3(0, 0, 0);

export function CameraRig({ activePosition, reducedMotion }: CameraRigProps) {
  const currentLookAt = useRef(new THREE.Vector3(0, 0, 0));

  const targetCameraPos = useMemo(() => {
    if (!activePosition) {
      return DEFAULT_CAMERA_POS;
    }
    const [x, y, z] = activePosition;
    // Position camera facing the artifact slightly elevated
    const dir = new THREE.Vector3(x, 0, z).normalize();
    if (dir.lengthSq() < 0.001) dir.set(0, 0, 1);
    return new THREE.Vector3(x + dir.x * 4.5, y + 1.2, z + dir.z * 4.5);
  }, [activePosition]);

  const targetLookAt = useMemo(() => {
    if (!activePosition) {
      return DEFAULT_LOOK_AT;
    }
    const [x, y, z] = activePosition;
    return new THREE.Vector3(x, y, z);
  }, [activePosition]);

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
