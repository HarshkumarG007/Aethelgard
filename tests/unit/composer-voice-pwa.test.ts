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

  describe("Sub-Gate 7.4: In-Browser Edit & Soft-Delete Chronicle Controls", () => {
    it("verifies MemoryComposerModal implements edit mode and calls PATCH /api/admin/memories/[id]", async () => {
      const composerPath = path.resolve(process.cwd(), "components/admin/MemoryComposerModal.tsx");
      const content = await fs.readFile(composerPath, "utf8");
      expect(content).toContain("initialData?: MemorySummary | null");
      expect(content).toContain("isEditMode");
      expect(content).toContain("PATCH");
      expect(content).toContain("/api/admin/memories/${initialData.id}");
      expect(content).toContain("Update Artifact");
    });

    it("verifies MemoryDeepView exposes Refine and Remove buttons strictly when isAdmin is true", async () => {
      const deepViewPath = path.resolve(process.cwd(), "components/sanctuary/MemoryDeepView.tsx");
      const content = await fs.readFile(deepViewPath, "utf8");
      expect(content).toContain("isAdmin?: boolean");
      expect(content).toContain("isAdmin &&");
      expect(content).toContain("Refine");
      expect(content).toContain("Remove");
      expect(content).toContain("setIsEditModalOpen(true)");
      expect(content).toContain("setShowDeleteConfirm(true)");
    });

    it("verifies MemoryDeepView wires soft-delete flow with confirmation and DELETE request", async () => {
      const deepViewPath = path.resolve(process.cwd(), "components/sanctuary/MemoryDeepView.tsx");
      const content = await fs.readFile(deepViewPath, "utf8");
      expect(content).toContain("DELETE");
      expect(content).toContain("/api/admin/memories/${memory.id}");
      expect(content).toContain('aria-labelledby="delete-dialog-title"');
      expect(content).toContain("Confirm Removal");
    });
  });

  describe("Sub-Gate 7.5: Ambient Soundscape & Visual Waveforms", () => {
    it("verifies AmbientEngine provides offline procedural soundscape methods", async () => {
      const enginePath = path.resolve(process.cwd(), "lib/audio/ambientEngine.ts");
      const content = await fs.readFile(enginePath, "utf8");
      expect(content).toContain("class AmbientSoundscapeEngine");
      expect(content).toContain("public async start");
      expect(content).toContain("public async stop");
      expect(content).toContain("public setVolume");
      expect(content).toContain("public getAnalyser");
      expect(content).toContain("export const ambientEngine");
    });

    it("verifies AmbientSoundscape component renders controls and real-time spectrum canvas", async () => {
      const soundscapePath = path.resolve(process.cwd(), "components/media/AmbientSoundscape.tsx");
      const content = await fs.readFile(soundscapePath, "utf8");
      expect(content).toContain("ambientEngine");
      expect(content).toContain("<canvas");
      expect(content).toContain("toggleSoundscape");
      expect(content).toContain("handleVolumeChange");
      expect(content).toContain('role="region"');
      expect(content).toContain("Sanctuary Atmosphere");
    });

    it("verifies SanctuaryHeader mounts AmbientSoundscape in utility bar", async () => {
      const headerPath = path.resolve(process.cwd(), "components/sanctuary/SanctuaryHeader.tsx");
      const content = await fs.readFile(headerPath, "utf8");
      expect(content).toContain("import { AmbientSoundscape }");
      expect(content).toContain("<AmbientSoundscape />");
    });

    it("verifies VoiceRecorder and MediaViewer render reactive waveforms", async () => {
      const voicePath = path.resolve(process.cwd(), "components/media/VoiceRecorder.tsx");
      const voiceContent = await fs.readFile(voicePath, "utf8");
      expect(voiceContent).toContain("<canvas");
      expect(voiceContent).toContain("analyserRef");
      expect(voiceContent).toContain("createMediaStreamSource");

      const viewerPath = path.resolve(process.cwd(), "components/media/MediaViewer.tsx");
      const viewerContent = await fs.readFile(viewerPath, "utf8");
      expect(viewerContent).toContain("Audio waveform visualizer");
      expect(viewerContent).toContain("wavePattern");
    });
  });

  describe("Sub-Gate 7.6: Turnkey Production Cloud Deployment Infrastructure", () => {
    it("verifies multi-stage Dockerfile implements zero-root container security and standalone execution", async () => {
      const dockerfilePath = path.resolve(process.cwd(), "Dockerfile");
      const content = await fs.readFile(dockerfilePath, "utf8");
      expect(content).toMatch(/FROM node:2[02]-alpine AS base/);
      expect(content).toContain("FROM base AS builder");
      expect(content).toMatch(/FROM node:2[02]-alpine AS runner/);
      expect(content).toContain("adduser --system --uid 1001 nextjs");
      expect(content).toContain("USER nextjs");
      expect(content).toContain('CMD ["node", "server.js"]');
    });

    it("verifies production docker-compose stack defines isolated networking and postgres healthchecks", async () => {
      const composePath = path.resolve(process.cwd(), "docker-compose.prod.yml");
      const content = await fs.readFile(composePath, "utf8");
      expect(content).toContain("image: postgres:16-alpine");
      expect(content).toContain("pg_isready");
      expect(content).toContain("service_healthy");
      expect(content).toContain("aethelgard-internal");
    });

    it("verifies comprehensive operations manual documents Vercel, Fly.io, Self-Hosted Docker and Release Gate", async () => {
      const guidePath = path.resolve(process.cwd(), "docs/DEPLOYMENT_GUIDE.md");
      const content = await fs.readFile(guidePath, "utf8");
      expect(content).toContain("Vercel + Neon PostgreSQL");
      expect(content).toContain("Fly.io Deployment");
      expect(content).toContain("Self-Hosted VPS with Docker Compose & Caddy");
      expect(content).toContain("Production Release Gate Checklist");
    });
  });
});
