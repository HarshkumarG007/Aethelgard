import * as THREE from "three";

/**
 * GLSL Vertex Shader for Memory Aura:
 * Handles subtle surface breathing/wave displacement.
 * Under reduced motion or Tier 2 static profile, uDisplacement is 0.0 (zero displacement).
 */
export const VERTEX_SHADER_SOURCE = `
varying vec3 vNormal;
varying vec3 vViewPosition;
uniform float uTime;
uniform float uDisplacement;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vec3 pos = position;
  if (uDisplacement > 0.0) {
    pos += normal * (sin(uTime * 2.0 + position.y * 3.0) * 0.03 * uDisplacement);
  }
  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  vViewPosition = -mvPosition.xyz;
  gl_Position = projectionMatrix * mvPosition;
}
`;

/**
 * GLSL Fragment Shader for Memory Aura:
 * Implements Fresnel chromatic rim glow.
 */
export const FRAGMENT_SHADER_SOURCE = `
varying vec3 vNormal;
varying vec3 vViewPosition;
uniform vec3 uColor;
uniform float uEmissiveIntensity;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 viewDir = normalize(vViewPosition);
  float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.5);
  vec3 finalColor = uColor * (0.35 + fresnel * uEmissiveIntensity);
  gl_FragColor = vec4(finalColor, 0.95);
}
`;

// Deterministic test seam for simulating shader support and validation
let shaderSupportOverride: boolean | null = null;
let shaderValidationOverride: boolean | null = null;

export function setShaderSupportOverride(override: boolean | null): void {
  shaderSupportOverride = override;
}

export function setShaderValidationOverride(override: boolean | null): void {
  shaderValidationOverride = override;
}

export function isShaderSupported(): boolean {
  if (shaderSupportOverride !== null) {
    return shaderSupportOverride;
  }
  // In browser, check if ShaderMaterial is constructible
  try {
    return typeof THREE.ShaderMaterial !== "undefined";
  } catch {
    return false;
  }
}

export function validateShaderSources(vertexSrc: string, fragmentSrc: string): boolean {
  if (shaderValidationOverride !== null) {
    return shaderValidationOverride;
  }
  // Check syntactic integrity
  const hasVertexMain = vertexSrc.includes("void main()") && vertexSrc.includes("gl_Position");
  const hasFragmentMain = fragmentSrc.includes("void main()") && fragmentSrc.includes("gl_FragColor");
  return hasVertexMain && hasFragmentMain;
}

export interface ArtifactMaterialOptions {
  mode?: "shader" | "standard";
  color: THREE.Color | string;
  isReducedMotion?: boolean;
  emissiveIntensity?: number;
  shaderProfile?: "full" | "static" | "standard";
  opacity?: number;
}

/**
 * Material Factory with Deterministic Dual-Path Fallback:
 *
 * Hierarchy:
 * 1. Mode explicitly standard or shaderProfile "standard" -> MeshStandardMaterial.
 * 2. Mode "shader" but shader unsupported -> MeshStandardMaterial (graceful fallback).
 * 3. Mode "shader" but shader validation fails -> MeshStandardMaterial (graceful fallback).
 * 4. Mode "shader" and supported -> ShaderMaterial with GLSL Fresnel glow.
 *
 * CRITICAL ARCHITECTURAL LAW:
 * Shader failure != WebGL failure. If GLSL cannot be used, the 3D scene continues
 * running normally using MeshStandardMaterial without triggering a 2D retreat.
 */
export function createArtifactMaterial(options: ArtifactMaterialOptions): THREE.Material {
  const mode = options.mode ?? "shader";
  const shaderProfile = options.shaderProfile ?? "full";
  const threeColor =
    options.color instanceof THREE.Color
      ? options.color
      : new THREE.Color(options.color);
  const emissiveIntensity = options.emissiveIntensity ?? 0.5;
  const opacity = options.opacity ?? 0.95;

  // Standard material fallback path
  if (
    mode === "standard" ||
    shaderProfile === "standard" ||
    !isShaderSupported() ||
    !validateShaderSources(VERTEX_SHADER_SOURCE, FRAGMENT_SHADER_SOURCE)
  ) {
    return new THREE.MeshStandardMaterial({
      color: threeColor,
      roughness: 0.35,
      metalness: 0.25,
      emissive: threeColor,
      emissiveIntensity: emissiveIntensity * 0.6,
      transparent: true,
      opacity,
    });
  }

  // GLSL custom shader path
  const displacement =
    options.isReducedMotion || shaderProfile === "static" ? 0.0 : 1.0;

  return new THREE.ShaderMaterial({
    vertexShader: VERTEX_SHADER_SOURCE,
    fragmentShader: FRAGMENT_SHADER_SOURCE,
    uniforms: {
      uTime: { value: 0 },
      uDisplacement: { value: displacement },
      uColor: { value: threeColor },
      uEmissiveIntensity: { value: emissiveIntensity },
    },
    transparent: true,
    depthWrite: true,
  });
}
