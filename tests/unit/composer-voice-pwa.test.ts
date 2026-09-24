import { describe, it, expect } from "vitest";
import manifest from "@/app/manifest";
import fs from "node:fs/promises";
import path from "node:path";

describe("Phase 7: Composer Modal, Voice Recorder & PWA Verification", () => {
  describe("Sub-Gate 7.1: PWA Web App Manifest Contract", () => {
    it("generates a compliant Web App Manifest with standalone display and theme color", () => {
      const manifestData = manifest();
      expect(manifestData.name).toBe("Aethelgard — Private Sanctuary");
      expect(manifestData.short_name).toBe("Aethelgard");
      expect(manifestData.display).toBe("standalone");
      expect(manifestData.background_color).toBe("#06070a");
      expect(manifestData.theme_color).toBe("#06070a");
      expect(manifestData.start_url).toBe("/");
      expect(manifestData.icons).toBeDefined();
      expect(manifestData.icons?.length).toBeGreaterThanOrEqual(1);
      expect(manifestData.icons?.[0].src).toBe("/icon.svg");
    });

    it("verifies icon.svg asset exists and contains valid SVG XML markup", async () => {
      const iconPath = path.resolve(process.cwd(), "app/icon.svg");
      const iconContent = await fs.readFile(iconPath, "utf8");
      expect(iconContent).toContain("<svg");
      expect(iconContent).toContain("viewBox=\"0 0 512 512\"");
      expect(iconContent).toContain("</svg>");
    });
  });

  describe("Sub-Gate 7.2: In-Browser Memory Composer Invariants", () => {
    it("verifies MemoryComposerModal component implements accessible dialog attributes", async () => {
      const composerPath = path.resolve(process.cwd(), "components/admin/MemoryComposerModal.tsx");
      const content = await fs.readFile(composerPath, "utf8");
      expect(content).toContain('role="dialog"');
      expect(content).toContain('aria-modal="true"');
      expect(content).toContain('aria-labelledby="composer-title"');
      expect(content).toContain("Escape");
    });

    it("verifies Composer coordinates presigned PUT and completion flow", async () => {
      const composerPath = path.resolve(process.cwd(), "components/admin/MemoryComposerModal.tsx");
      const content = await fs.readFile(composerPath, "utf8");
      expect(content).toContain('fetch("/api/admin/media/upload-url"');
      expect(content).toContain('method: "PUT"');
      expect(content).toContain("/api/admin/media/${assetId}/complete");
    });

    it("verifies SanctuaryHeader restricts Inscribe button strictly to admin role", async () => {
      const headerPath = path.resolve(process.cwd(), "components/sanctuary/SanctuaryHeader.tsx");
      const content = await fs.readFile(headerPath, "utf8");
      expect(content).toContain('user.role === "admin"');
      expect(content).toContain("Inscribe");
    });
  });

  describe("Sub-Gate 7.3: Voice Recorder & Correspondence Integration", () => {
    it("verifies VoiceRecorder implements MediaRecorder lifecycle and controls", async () => {
      const voicePath = path.resolve(process.cwd(), "components/media/VoiceRecorder.tsx");
      const content = await fs.readFile(voicePath, "utf8");
      expect(content).toContain("navigator.mediaDevices.getUserMedia");
      expect(content).toContain("MediaRecorder");
      expect(content).toContain("audioChunksRef");
      expect(content).toContain("startRecording");
      expect(content).toContain("stopRecording");
      expect(content).toContain("discardRecording");
    });

    it("verifies LettersChamber integrates VoiceRecorder for spoken correspondence", async () => {
      const lettersPath = path.resolve(process.cwd(), "components/sanctuary/LettersChamber.tsx");
      const content = await fs.readFile(lettersPath, "utf8");
      expect(content).toContain("<VoiceRecorder");
      expect(content).toContain("import { VoiceRecorder }");
    });
  });
});
