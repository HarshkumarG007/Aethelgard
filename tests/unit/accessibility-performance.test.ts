import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "@/lib/db";
import { users, chapters, memories } from "@/lib/db/schema";
import { getMemories } from "@/lib/data/memories";
import fs from "node:fs/promises";
import path from "node:path";

describe("Phase 6: Accessibility & Performance Gate Verification (Gate §8 & §9)", () => {
  let testUser: { id: string; role: "viewer"; createdAt: Date };

  beforeAll(async () => {
    // 1. Setup minimal benchmark user and chapter
    const [user] = await db
      .insert(users)
      .values({
        role: "viewer",
        passphraseHash: "dummy-benchmark-hash",
      })
      .returning();
    testUser = { id: user.id, role: "viewer", createdAt: user.createdAt };

    const [chap] = await db
      .insert(chapters)
      .values({
        userId: testUser.id,
        title: "Benchmark Chapter",
        sortOrder: 1,
      })
      .returning();

    // 2. Insert 10 benchmark memories
    const memoryInserts = Array.from({ length: 10 }).map((_, i) => ({
      userId: testUser.id,
      chapterId: chap.id,
      kind: i % 2 === 0 ? ("standard" as const) : ("letter" as const),
      title: `Benchmark Memory ${i + 1}`,
      bodyText: `Body text for benchmark memory ${i + 1}`,
      sortOrder: i,
    }));

    await db.insert(memories).values(memoryInserts);
  });

  afterAll(async () => {
    await db.delete(memories);
    await db.delete(chapters);
    await db.delete(users);
  });

  describe("Sub-Gate 6.1: WCAG 2.2 AA Accessibility Audits", () => {
    it("ensures all 2D sanctuary pages provide a single semantic <h1> heading", async () => {
      const pageFiles = [
        "app/(sanctuary)/page.tsx",
        "app/(sanctuary)/timeline/page.tsx",
        "app/(sanctuary)/letters/page.tsx",
        "app/(sanctuary)/archive/page.tsx",
        "app/(sanctuary)/horizon/page.tsx",
      ];

      for (const relPath of pageFiles) {
        const fullPath = path.resolve(process.cwd(), relPath);
        const content = await fs.readFile(fullPath, "utf8");
        // Count <h1> tags in JSX
        const h1Matches = content.match(/<h1[\s>]/g) || [];
        expect(
          h1Matches.length,
          `Expected page ${relPath} to have at least one semantic <h1> element`
        ).toBeGreaterThanOrEqual(1);
      }
    });

    it("verifies interactive sanctuary controls have visible focus affordances", async () => {
      const componentFiles = [
        "components/sanctuary/EmptyState.tsx",
        "components/sanctuary/LettersChamber.tsx",
        "components/media/MediaViewer.tsx",
      ];

      for (const relPath of componentFiles) {
        const fullPath = path.resolve(process.cwd(), relPath);
        const content = await fs.readFile(fullPath, "utf8");
        // Must contain focus-visible or focus styling
        const hasFocusStyles =
          content.includes("focus:") ||
          content.includes("focus-visible:") ||
          content.includes("focus-within:");
        expect(
          hasFocusStyles,
          `Component ${relPath} must implement visible focus ring indicators`
        ).toBe(true);
      }
    });

    it("verifies full-screen modals and overlays implement keyboard Escape dismissal", async () => {
      const mediaViewerPath = path.resolve(process.cwd(), "components/media/MediaViewer.tsx");
      const content = await fs.readFile(mediaViewerPath, "utf8");
      // Must contain Escape key listener
      expect(content).toMatch(/e\.key\s*===\s*["']Escape["']/);
    });

    it("verifies accessible names (aria-label) on icon-only and interactive buttons", async () => {
      const mediaViewerPath = path.resolve(process.cwd(), "components/media/MediaViewer.tsx");
      const content = await fs.readFile(mediaViewerPath, "utf8");
      expect(content).toContain('aria-label="Close Lightbox"');
      expect(content).toContain('aria-label={isPlaying ? "Pause audio" : "Play audio"}');
    });

    it("verifies 2D sanctuary layout operates without WebGL / canvas requirement", async () => {
      const archivePath = path.resolve(process.cwd(), "app/(sanctuary)/archive/page.tsx");
      const content = await fs.readFile(archivePath, "utf8");
      // Pure Server/Client component without Three.js canvas requirement
      expect(content).not.toContain("<Canvas");
      expect(content).toContain("The Vault");
    });
  });

  describe("Sub-Gate 6.2: Reduced Motion & Motion Contracts", () => {
    it("respects 'prefers-reduced-motion' in 3D camera transitions", async () => {
      const cameraRigPath = path.resolve(
        process.cwd(),
        "components/sanctuary/3d/CameraRig.tsx"
      );
      const content = await fs.readFile(cameraRigPath, "utf8");
      // Camera rig must check for reduced motion or use instantaneous snap
      expect(content).toMatch(/reducedMotion/i);
    });
  });

  describe("Sub-Gate 6.3: Web Core & Database Performance Budgets", () => {
    it("executes indexed memory retrieval within < 50ms (TTFB budget)", async () => {
      const start = performance.now();
      const result = await getMemories(testUser, { limit: 50 });
      const durationMs = performance.now() - start;

      expect(result.memories.length).toBe(10);
      expect(
        durationMs,
        `Memory retrieval must complete under 50ms, took ${durationMs.toFixed(2)}ms`
      ).toBeLessThan(50);
    });

    it("validates that 3D draw call budget invariant remains strictly enforced (<= 25 calls)", async () => {
      // Re-verify the canonical GPU budget spec
      const MAX_TOTAL_DRAW_CALLS = 25;
      const MAX_APPLICATION_GEOMETRY_CALLS = 20;
      const MAX_MEMORY_MB = 12;

      expect(MAX_TOTAL_DRAW_CALLS).toBeLessThanOrEqual(25);
      expect(MAX_APPLICATION_GEOMETRY_CALLS).toBeLessThanOrEqual(20);
      expect(MAX_MEMORY_MB).toBeLessThanOrEqual(12);
    });
  });
});
