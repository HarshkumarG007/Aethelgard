"use client";

import React, { useRef, useMemo, useEffect } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import type { SpatialMemoryData } from "./state/sanctuary3d.types";
import { useSanctuary3DStore } from "./state/sanctuary3d.store";
import { createArtifactMaterial } from "./shaders/memoryAura";

interface MemoryArtifactProps {
  memory: SpatialMemoryData;
  reducedMotion: boolean;
  onNavigate: (id: string) => void;
}

export function MemoryArtifact({
  memory,
  reducedMotion,
  onNavigate,
}: MemoryArtifactProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { artifact, quality, hoverEnter, hoverLeave, focusArtifact, activateArtifact } =
    useSanctuary3DStore();

  const isCurrent = artifact.activeId === memory.id;
  const artifactState = isCurrent ? artifact.state : "DORMANT";

  // Deterministic procedural geometry selection by kind
  const geometry = useMemo(() => {
    switch (memory.kind) {
      case "letter":
        // Parchment / tablet
        return new THREE.BoxGeometry(0.9, 1.3, 0.08);
      case "milestone":
        // Star-like faceted orb
        return new THREE.IcosahedronGeometry(0.7, 1);
      case "future":
        // Horizon ring / arch
        return new THREE.TorusGeometry(0.6, 0.12, 16, 32);
      case "standard":
      default:
        // Hexagonal prism
        return new THREE.CylinderGeometry(0.6, 0.6, 1.2, 6);
    }
  }, [memory.kind]);

  // Color selection based on kind
  const baseColor = useMemo(() => {
    switch (memory.kind) {
      case "milestone":
        return new THREE.Color("#d97706"); // Amber gold
      case "letter":
        return new THREE.Color("#9333ea"); // Deep purple
      case "future":
        return new THREE.Color("#059669"); // Emerald horizon
      case "standard":
      default:
        return new THREE.Color("#0284c7"); // Celestial sky
    }
  }, [memory.kind]);

  // Compute state-dependent presentation values declaratively
  const { emissiveIntensity, opacity, targetScale } = useMemo(() => {
    switch (artifactState) {
      case "ACTIVE":
        return { emissiveIntensity: 0.9, opacity: 1.0, targetScale: 1.25 };
      case "FOCUSED":
        return { emissiveIntensity: 0.6, opacity: 1.0, targetScale: 1.15 };
      case "PROXIMATE":
        return { emissiveIntensity: 0.35, opacity: 0.95, targetScale: 1.08 };
      case "DORMANT":
      default:
        return { emissiveIntensity: 0.08, opacity: 0.85, targetScale: 1.0 };
    }
  }, [artifactState]);

  // Dual-path material (GLSL shader with Fresnel vs MeshStandardMaterial fallback)
  const material = useMemo(() => {
    return createArtifactMaterial({
      color: baseColor,
      emissiveIntensity,
      opacity,
      isReducedMotion: reducedMotion,
      shaderProfile: quality.shaderProfile,
    });
  }, [baseColor, emissiveIntensity, opacity, reducedMotion, quality.shaderProfile]);

  // Seed offset for gentle asynchronous ambient animation
  const seedOffset = useMemo(
    () => (memory.position[0] * 13 + memory.position[2] * 7) % 100,
    [memory.position]
  );

  // Animation loop with strict respect for prefers-reduced-motion and zero per-frame allocations
  useFrame((_, delta) => {
    if (!meshRef.current) return;

    if (reducedMotion) {
      // Instant scale change, absolutely zero continuous floating or rotation
      meshRef.current.scale.set(targetScale, targetScale, targetScale);
      meshRef.current.position.set(
        memory.position[0],
        memory.position[1],
        memory.position[2]
      );
      meshRef.current.rotation.set(0, 0, 0);
      return;
    }

    // Smooth subtle scale damping
    const currentScale = meshRef.current.scale.x;
    const nextScale = THREE.MathUtils.damp(
      currentScale,
      targetScale,
      8,
      delta
    );
    meshRef.current.scale.set(nextScale, nextScale, nextScale);

    // Subtle ambient levitation and slow rotation
    const elapsed = performance.now() * 0.001 + seedOffset;
    const floatY = Math.sin(elapsed * 1.2) * 0.08;
    meshRef.current.position.y = memory.position[1] + floatY;

    // Slow ambient rotation
    meshRef.current.rotation.y += delta * 0.2;

    // Update GLSL uniform on mesh material if custom shader is active
    const activeMat = meshRef.current.material;
    if (activeMat instanceof THREE.ShaderMaterial && activeMat.uniforms.uTime) {
      activeMat.uniforms.uTime.value += delta;
    }
  });

  // Strict deterministic disposal on unmount
  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  const handlePointerOver = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    hoverEnter(memory.id);
  };

  const handlePointerOut = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    hoverLeave(memory.id);
  };

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    focusArtifact(memory.id);
    activateArtifact(memory.id);
    onNavigate(memory.id);
  };

  return (
    <mesh
      ref={meshRef}
      position={memory.position}
      geometry={geometry}
      material={material}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    />
  );
}

