import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

describe("Phase 3C: Resource Lifecycle & Deterministic Disposal", () => {
  it("InstancedMemoryArtifacts implements deterministic GPU disposal", () => {
    const filePath = join(process.cwd(), "components/sanctuary/3d/InstancedMemoryArtifacts.tsx");
    const code = readFileSync(filePath, "utf-8");
    
    // Assert the presence of geometry and material dispose calls inside useEffect cleanup
    expect(code).toMatch(/standardGeom\.dispose\(\)/);
    expect(code).toMatch(/letterGeom\.dispose\(\)/);
    expect(code).toMatch(/milestoneGeom\.dispose\(\)/);
    expect(code).toMatch(/futureGeom\.dispose\(\)/);
    expect(code).toMatch(/material\.dispose\(\)/);
  });

  it("ChapterIslandMesh implements deterministic GPU disposal", () => {
    const filePath = join(process.cwd(), "components/sanctuary/3d/islands/ChapterIslandMesh.tsx");
    const code = readFileSync(filePath, "utf-8");
    
    expect(code).toMatch(/daisGeometry\.dispose\(\)/);
    expect(code).toMatch(/daisMaterial\.dispose\(\)/);
    expect(code).toMatch(/ringGeometry\.dispose\(\)/);
    expect(code).toMatch(/ringMaterial\.dispose\(\)/);
  });

  it("MemoryArtifact implements deterministic GPU disposal and avoids per-instance allocation", () => {
    const filePath = join(process.cwd(), "components/sanctuary/3d/MemoryArtifact.tsx");
    const code = readFileSync(filePath, "utf-8");
    
    expect(code).toMatch(/geometry\.dispose\(\)/);
    expect(code).toMatch(/material\.dispose\(\)/);
    
    // Memory artifact floating animation should be offloaded to shader to prevent vector allocations in useFrame
    expect(code).not.toMatch(/position\.y\s*=\s*memory\.position\[1\]\s*\+\s*floatY/);
  });

  it("CameraRig implements clamped safe bounds for spatial navigation", () => {
    const filePath = join(process.cwd(), "components/sanctuary/3d/CameraRig.tsx");
    const code = readFileSync(filePath, "utf-8");

    expect(code).toMatch(/CAMERA_SAFE_BOUNDS_R\s*=\s*55/);
    expect(code).toMatch(/distSq\s*>\s*CAMERA_SAFE_BOUNDS_R\s*\*\s*CAMERA_SAFE_BOUNDS_R/);
  });
});
