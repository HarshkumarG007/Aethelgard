import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as THREE from "three";
import {
  createArtifactMaterial,
  setShaderSupportOverride,
  setShaderValidationOverride,
  VERTEX_SHADER_SOURCE,
  FRAGMENT_SHADER_SOURCE,
  validateShaderSources,
} from "@/components/sanctuary/3d/shaders/memoryAura";

describe("Sub-Gate 3B.4: Dual Shader Pipeline & Deterministic Fallback", () => {
  beforeEach(() => {
    setShaderSupportOverride(null);
    setShaderValidationOverride(null);
  });

  afterEach(() => {
    setShaderSupportOverride(null);
    setShaderValidationOverride(null);
  });

  describe("Shader Validation Seam", () => {
    it("validates well-formed GLSL vertex and fragment sources", () => {
      expect(
        validateShaderSources(VERTEX_SHADER_SOURCE, FRAGMENT_SHADER_SOURCE)
      ).toBe(true);
    });

    it("rejects invalid or corrupted GLSL shader sources", () => {
      expect(validateShaderSources("invalid code", FRAGMENT_SHADER_SOURCE)).toBe(
        false
      );
      expect(validateShaderSources(VERTEX_SHADER_SOURCE, "missing main")).toBe(
        false
      );
    });
  });

  describe("Shader Supported Path (Normal Operation)", () => {
    it("creates ShaderMaterial with Fresnel uniforms when supported", () => {
      setShaderSupportOverride(true);
      setShaderValidationOverride(true);

      const mat = createArtifactMaterial({
        color: "#0284c7",
        emissiveIntensity: 0.8,
      });

      expect(mat).toBeInstanceOf(THREE.ShaderMaterial);
      const shaderMat = mat as THREE.ShaderMaterial;
      expect(shaderMat.uniforms.uColor.value).toBeInstanceOf(THREE.Color);
      expect(shaderMat.uniforms.uEmissiveIntensity.value).toBe(0.8);
      expect(shaderMat.uniforms.uDisplacement.value).toBe(1.0);
      expect(shaderMat.transparent).toBe(true);

      mat.dispose();
    });

    it("sets uDisplacement to 0.0 under reduced motion while keeping Fresnel shader active", () => {
      setShaderSupportOverride(true);
      setShaderValidationOverride(true);

      const mat = createArtifactMaterial({
        color: "#d97706",
        isReducedMotion: true,
      });

      expect(mat).toBeInstanceOf(THREE.ShaderMaterial);
      const shaderMat = mat as THREE.ShaderMaterial;
      expect(shaderMat.uniforms.uDisplacement.value).toBe(0.0);

      mat.dispose();
    });

    it("sets uDisplacement to 0.0 under Tier 2 static profile", () => {
      setShaderSupportOverride(true);
      setShaderValidationOverride(true);

      const mat = createArtifactMaterial({
        color: "#9333ea",
        shaderProfile: "static",
      });

      expect(mat).toBeInstanceOf(THREE.ShaderMaterial);
      const shaderMat = mat as THREE.ShaderMaterial;
      expect(shaderMat.uniforms.uDisplacement.value).toBe(0.0);

      mat.dispose();
    });
  });

  describe("Deterministic Fallback Path (Shader Failure != WebGL Failure)", () => {
    it("transparently falls back to MeshStandardMaterial when shader is unsupported", () => {
      setShaderSupportOverride(false);

      const mat = createArtifactMaterial({
        color: "#0284c7",
        emissiveIntensity: 0.5,
      });

      expect(mat).toBeInstanceOf(THREE.MeshStandardMaterial);
      const stdMat = mat as THREE.MeshStandardMaterial;
      expect(stdMat.color).toBeInstanceOf(THREE.Color);
      expect(stdMat.emissive).toBeInstanceOf(THREE.Color);
      expect(stdMat.transparent).toBe(true);

      mat.dispose();
    });

    it("transparently falls back to MeshStandardMaterial when shader validation fails", () => {
      setShaderSupportOverride(true);
      setShaderValidationOverride(false); // Simulate GLSL validation/linking failure

      const mat = createArtifactMaterial({
        color: "#059669",
      });

      expect(mat).toBeInstanceOf(THREE.MeshStandardMaterial);
      expect(mat).not.toBeInstanceOf(THREE.ShaderMaterial);

      mat.dispose();
    });

    it("uses MeshStandardMaterial when explicit mode is 'standard'", () => {
      setShaderSupportOverride(true);
      setShaderValidationOverride(true);

      const mat = createArtifactMaterial({
        mode: "standard",
        color: "#d97706",
      });

      expect(mat).toBeInstanceOf(THREE.MeshStandardMaterial);

      mat.dispose();
    });

    it("uses MeshStandardMaterial when shaderProfile is 'standard' (Tier 1 Eco)", () => {
      setShaderSupportOverride(true);
      setShaderValidationOverride(true);

      const mat = createArtifactMaterial({
        shaderProfile: "standard",
        color: "#d97706",
      });

      expect(mat).toBeInstanceOf(THREE.MeshStandardMaterial);

      mat.dispose();
    });
  });
});
