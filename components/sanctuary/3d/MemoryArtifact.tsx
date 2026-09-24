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
  globalUniforms: { uTime: { value: number } };
}

export function MemoryArtifact({
  memory,
  reducedMotion,
  onNavigate,
  globalUniforms,
}: MemoryArtifactProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { artifact, quality, hoverEnter, hoverLeave, focusMemory, activateMemory } =
    useSanctuary3DStore();

  // Determine if this memory is currently the target of spatial focus
  const isCurrent =
    artifact.spatialFocus.kind === "memory" &&
    artifact.spatialFocus.memoryId === memory.id;
  const isHovered = artifact.hoveredId === memory.id;

  const artifactState = isCurrent
    ? artifact.state === "ACTIVE"
      ? "ACTIVE"
      : "FOCUSED"
    : isHovered && artifact.state === "DORMANT"
      ? "PROXIMATE"
      : "DORMANT";

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
  const presentation =
    artifactState === "ACTIVE"
      ? { emissiveIntensity: 0.9, opacity: 1.0, targetScale: 1.25 }
      : artifactState === "FOCUSED"
        ? { emissiveIntensity: 0.6, opacity: 1.0, targetScale: 1.15 }
        : artifactState === "PROXIMATE"
          ? { emissiveIntensity: 0.35, opacity: 0.95, targetScale: 1.08 }
          : { emissiveIntensity: 0.08, opacity: 0.85, targetScale: 1.0 };
  const { emissiveIntensity, opacity, targetScale } = presentation;

  // Seed offset for gentle asynchronous ambient animation
  const seedOffset = (memory.position[0] * 13 + memory.position[2] * 7) % 100;

  // Dual-path material (GLSL shader with Fresnel vs MeshStandardMaterial fallback)
  const material = useMemo(() => {
    return createArtifactMaterial({
      color: baseColor,
      emissiveIntensity,
      opacity,
      isReducedMotion: reducedMotion,
      shaderProfile: quality.shaderProfile,
      globalUniforms,
      seedOffset,
    });
  }, [baseColor, emissiveIntensity, opacity, reducedMotion, quality.shaderProfile, globalUniforms, seedOffset]);

  // Animation loop with strict respect for prefers-reduced-motion and zero per-frame allocations.
  // Floating levitation and rotation are handled entirely in the vertex shader.
  // This loop solely performs scalar damping for the uScale uniform / mesh scale.
  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const mat = mesh.material;

    if (reducedMotion) {
      // Instant scale change, zero interpolation
      if (mat instanceof THREE.ShaderMaterial && mat.uniforms.uScale) {
        mat.uniforms.uScale.value = targetScale;
      } else {
        mesh.scale.set(targetScale, targetScale, targetScale);
      }
      return;
    }

    if (mat instanceof THREE.ShaderMaterial && mat.uniforms.uScale) {
      const currentScale = mat.uniforms.uScale.value;
      if (Math.abs(currentScale - targetScale) > 0.001) {
        mat.uniforms.uScale.value = THREE.MathUtils.damp(
          currentScale,
          targetScale,
          8,
          delta
        );
      }
    } else {
      const currentScale = mesh.scale.x;
      if (Math.abs(currentScale - targetScale) > 0.001) {
        const nextScale = THREE.MathUtils.damp(
          currentScale,
          targetScale,
          8,
          delta
        );
        mesh.scale.set(nextScale, nextScale, nextScale);
      }
    }
  });

  // Strict deterministic disposal on unmount
  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  const TOUCH_MOVE_CANCEL_THRESHOLD_PX = 100;
  const pointerDownPos = useRef<{ x: number; y: number } | null>(null);

  const handlePointerOver = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    hoverEnter(memory.id);
  };

  const handlePointerOut = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    hoverLeave(memory.id);
  };

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

    pointerDownPos.current = null;

    if (distSq > TOUCH_MOVE_CANCEL_THRESHOLD_PX) {
      return;
    }

    focusMemory(memory.id);
    activateMemory(memory.id);
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
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    />
  );
}

