"use client";

import React, { useRef, useMemo, useEffect } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

interface AtmosphericMotesProps {
  count: number;
  reducedMotion: boolean;
}

export function AtmosphericMotes({ count, reducedMotion }: AtmosphericMotesProps) {
  const pointsRef = useRef<THREE.Points>(null);

  // Buffer geometry for atmospheric motes
  const { geometry, positions } = useMemo(() => {
    const clampedCount = Math.max(0, Math.min(count, 500));
    const posArray = new Float32Array(clampedCount * 3);

    // Seed deterministic pseudo-random particle distribution within sanctuary volume
    for (let i = 0; i < clampedCount; i++) {
      const idx = i * 3;
      const radius = 10 + ((i * 17) % 30);
      const angle = (i * 2.39996); // Golden angle
      posArray[idx] = Math.cos(angle) * radius;
      posArray[idx + 1] = -1 + ((i * 1.3) % 12);
      posArray[idx + 2] = Math.sin(angle) * radius;
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.BufferAttribute(posArray, 3));
    return { geometry: geom, positions: posArray };
  }, [count]);

  const material = useMemo(
    () =>
      new THREE.PointsMaterial({
        color: "#38bdf8",
        size: 0.16,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    []
  );

  // Animation loop: gentle upward drift when reducedMotion is false; strictly frozen when true
  useFrame((_, delta) => {
    if (!pointsRef.current || reducedMotion || count <= 0) return;

    const posAttr = pointsRef.current.geometry.attributes.position;
    if (!posAttr) return;

    const arr = posAttr.array as Float32Array;
    const speed = 0.35;

    for (let i = 1; i < arr.length; i += 3) {
      arr[i] += delta * speed;
      if (arr[i] > 11) {
        arr[i] = -1;
      }
    }

    posAttr.needsUpdate = true;
  });

  // Strict resource disposal on unmount
  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  if (count <= 0) return null;

  return (
    <points
      ref={pointsRef}
      geometry={geometry}
      material={material}
      name="atmospheric-motes"
    />
  );
}
