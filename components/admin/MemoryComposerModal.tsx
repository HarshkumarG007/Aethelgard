"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { ChapterSummary } from "@/lib/data/chapters";

interface MemoryComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultKind?: "standard" | "letter" | "milestone" | "future";
}

const EMOTIONS = [
  { value: "wonder", label: "Wonder", color: "border-amber-500/40 text-amber-300 bg-amber-950/20" },
  { value: "nostalgia", label: "Nostalgia", color: "border-orange-500/40 text-orange-300 bg-orange-950/20" },
  { value: "peace", label: "Peace", color: "border-emerald-500/40 text-emerald-300 bg-emerald-950/20" },
  { value: "joy", label: "Joy", color: "border-yellow-500/40 text-yellow-300 bg-yellow-950/20" },
  { value: "longing", label: "Longing", color: "border-purple-500/40 text-purple-300 bg-purple-950/20" },
  { value: "excitement", label: "Excitement", color: "border-rose-500/40 text-rose-300 bg-rose-950/20" },
  { value: "gratitude", label: "Gratitude", color: "border-sky-500/40 text-sky-300 bg-sky-950/20" },
] as const;

export function MemoryComposerModal({
  isOpen,
  onClose,
  defaultKind = "standard",
}: MemoryComposerModalProps) {
  const router = useRouter();

  // Form states
  const [kind, setKind] = useState<"standard" | "letter" | "milestone" | "future">(defaultKind);
  const [title, setTitle] = useState("");
  const [memoryDate, setMemoryDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [chapterId, setChapterId] = useState("");
  const [emotion, setEmotion] = useState<string>("wonder");
  const [locationName, setLocationName] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);

  // Chapters list
  const [chapters, setChapters] = useState<ChapterSummary[]>([]);
  const [isFetchingChapters, setIsFetchingChapters] = useState(false);

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch chapters when modal opens
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    const loadChapters = async () => {
      try {
        const res = await fetch("/api/chapters");
        const data = await res.json();
        if (isMounted && data.success && data.data?.chapters) {
          setChapters(data.data.chapters);
          if (data.data.chapters.length > 0 && !chapterId) {
            setChapterId(data.data.chapters[0].id);
          }
        }
      } catch {
        // Soft fallback
      } finally {
        if (isMounted) setIsFetchingChapters(false);
      }
    };

    loadChapters();

    return () => {
      isMounted = false;
    };
  }, [isOpen, chapterId]);

  // Handle Escape key to dismiss
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen && !isSubmitting) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  // File selection
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (file.type.startsWith("image/")) {
        const preview = URL.createObjectURL(file);
        setFilePreviewUrl(preview);
      } else {
        setFilePreviewUrl(null);
      }
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (file.type.startsWith("image/")) {
        const preview = URL.createObjectURL(file);
        setFilePreviewUrl(preview);
      } else {
        setFilePreviewUrl(null);
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage("Please enter an artifact title.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setStatusMessage("Inscribing memory into sanctuary chronicle...");

    try {
      // 1. Create Memory record
      const memoryPayload = {
        kind,
        title: title.trim(),
        bodyText: bodyText.trim() || null,
        memoryDate: memoryDate || null,
        chapterId: chapterId || null,
        emotion: emotion || null,
        location: locationName.trim() ? { name: locationName.trim() } : null,
        isFavorite,
      };

      const createRes = await fetch("/api/admin/memories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(memoryPayload),
      });

      if (!createRes.ok) {
        const errData = await createRes.json();
        throw new Error(errData.error?.message || "Failed to create memory");
      }

      const { data: createdData } = await createRes.json();
      const newMemoryId = createdData.memoryId;

      // 2. Upload file if selected
      if (selectedFile && newMemoryId) {
        setStatusMessage(`Authorizing secure upload for ${selectedFile.name}...`);

        const uploadAuthRes = await fetch("/api/admin/media/upload-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            memoryId: newMemoryId,
            filename: selectedFile.name,
            contentType: selectedFile.type,
            sizeBytes: selectedFile.size,
            isPrimary: true,
          }),
        });

        if (!uploadAuthRes.ok) {
          const authErr = await uploadAuthRes.json();
          throw new Error(authErr.error?.message || "Failed to authorize media upload");
        }

        const { data: authData } = await uploadAuthRes.json();
        const { uploadUrl, assetId } = authData;

        setStatusMessage("Uploading artifact binary directly to private vault...");
        const uploadPutRes = await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": selectedFile.type },
          body: selectedFile,
        });

        if (!uploadPutRes.ok) {
          throw new Error("Direct binary upload to storage failed");
        }

        setStatusMessage("Verifying file signatures & generating WebP variants...");
        const completeRes = await fetch(`/api/admin/media/${assetId}/complete`, {
          method: "POST",
        });

        if (!completeRes.ok) {
          const compErr = await completeRes.json();
          throw new Error(compErr.error?.message || "Failed to finalize media processing");
        }
      }

      setStatusMessage("Artifact sealed successfully!");
      setTimeout(() => {
        // Reset and close
        setTitle("");
        setBodyText("");
        setLocationName("");
        setSelectedFile(null);
        setFilePreviewUrl(null);
        setStatusMessage(null);
        setIsSubmitting(false);
        onClose();
        router.refresh();
      }, 700);
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || "An unexpected error occurred");
      setIsSubmitting(false);
      setStatusMessage(null);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="composer-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-2xl rounded-2xl border border-primary/30 bg-background-void/95 p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-background-border pb-4">
          <div>
            <h2
              id="composer-title"
              className="font-serif text-2xl font-semibold tracking-wide text-primary-light"
            >
              Inscribe Sanctuary Artifact
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Add a new memory, letter, or milestone to the eternal archive.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close memory composer"
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-background-surface transition-colors focus-visible:ring-2 focus-visible:ring-primary"
          >
            ✕
          </button>
        </div>

        {/* Error / Status Alerts */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl border border-red-500/30 bg-red-950/20 text-xs text-red-300">
            {errorMessage}
          </div>
        )}
        {statusMessage && (
          <div className="p-3.5 rounded-xl border border-primary/40 bg-primary/10 text-xs text-primary-light flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-primary animate-ping" />
            {statusMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Artifact Kind Selector */}
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-2 uppercase tracking-wider">
              Chamber Classification
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: "standard", label: "Standard", desc: "Everyday memory" },
                { id: "letter", label: "Letter", desc: "Written parchment" },
                { id: "milestone", label: "Milestone", desc: "Pivotal event" },
                { id: "future", label: "Horizon", desc: "Future promise" },
              ].map((k) => (
                <button
                  key={k.id}
                  type="button"
                  onClick={() => setKind(k.id as typeof kind)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    kind === k.id
                      ? "border-primary bg-primary/20 text-white shadow-sm"
                      : "border-background-border bg-background-elevated/40 text-gray-400 hover:text-gray-200 hover:border-gray-700"
                  }`}
                >
                  <div className="text-xs font-semibold">{k.label}</div>
                  <div className="text-[10px] text-gray-400 truncate">{k.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Title & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label htmlFor="artifact-title" className="block text-xs font-medium text-gray-300 mb-1">
                Artifact Title *
              </label>
              <input
                id="artifact-title"
                type="text"
                required
                maxLength={200}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  kind === "letter"
                    ? "Letter from the High Conservatory..."
                    : kind === "future"
                    ? "Promise of the Northern Voyage..."
                    : "The Starlight Observatory..."
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-background-border bg-background-elevated text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label htmlFor="artifact-date" className="block text-xs font-medium text-gray-300 mb-1">
                Date
              </label>
              <input
                id="artifact-date"
                type="date"
                value={memoryDate}
                onChange={(e) => setMemoryDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-background-border bg-background-elevated text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Chapter & Emotion */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="artifact-chapter" className="block text-xs font-medium text-gray-300 mb-1">
                Island Chapter
              </label>
              <select
                id="artifact-chapter"
                value={chapterId}
                onChange={(e) => setChapterId(e.target.value)}
                disabled={isFetchingChapters}
                className="w-full px-3.5 py-2.5 rounded-xl border border-background-border bg-background-elevated text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              >
                <option value="">No specific chapter (Root Arch)</option>
                {chapters.map((chap) => (
                  <option key={chap.id} value={chap.id}>
                    {chap.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="artifact-emotion" className="block text-xs font-medium text-gray-300 mb-1">
                Emotional Essence
              </label>
              <select
                id="artifact-emotion"
                value={emotion}
                onChange={(e) => setEmotion(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-background-border bg-background-elevated text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary capitalize"
              >
                {EMOTIONS.map((em) => (
                  <option key={em.value} value={em.value}>
                    {em.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Location Name */}
          <div>
            <label htmlFor="artifact-location" className="block text-xs font-medium text-gray-300 mb-1">
              Location / Setting (Optional)
            </label>
            <input
              id="artifact-location"
              type="text"
              maxLength={200}
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="e.g. Mount Horizon Observatory, Coastal Winds, etc."
              className="w-full px-3.5 py-2 rounded-xl border border-background-border bg-background-elevated text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Narrative Prose / Body */}
          <div>
            <label htmlFor="artifact-body" className="block text-xs font-medium text-gray-300 mb-1">
              Manuscript Text / Memory Prose
            </label>
            <textarea
              id="artifact-body"
              rows={4}
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              placeholder="Write the intimate words, details, or dialogue of this memory..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-background-border bg-background-elevated text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-y"
            />
          </div>

          {/* Drag & Drop File Upload Area */}
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              Attach Photograph or Artifact (Optional)
            </label>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-background-border hover:border-primary/50 rounded-xl p-4 text-center cursor-pointer transition-colors bg-background-elevated/30 flex flex-col items-center justify-center gap-2"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif,audio/mpeg,audio/wav,audio/mp4"
                className="hidden"
                onChange={handleFileChange}
              />

              {filePreviewUrl ? (
                <div className="relative max-h-36 overflow-hidden rounded-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={filePreviewUrl} alt="Preview" className="max-h-36 object-contain rounded-lg" />
                  <span className="block mt-1 text-[11px] text-primary-light font-mono">
                    {selectedFile?.name} ({(selectedFile!.size / (1024 * 1024)).toFixed(2)} MB)
                  </span>
                </div>
              ) : selectedFile ? (
                <div className="text-xs text-primary-light font-medium">
                  📎 {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                </div>
              ) : (
                <>
                  <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary-light text-sm">
                    ✦
                  </div>
                  <p className="text-xs text-gray-300">
                    Drag and drop a photo or manuscript, or <span className="text-primary-light underline">browse</span>
                  </p>
                  <p className="text-[10px] text-gray-500">
                    Supports JPEG, PNG, WebP, AVIF up to 25MB (Auto-compressed to WebP derivatives)
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Options: Favorite */}
          <div className="flex items-center gap-2">
            <input
              id="artifact-favorite"
              type="checkbox"
              checked={isFavorite}
              onChange={(e) => setIsFavorite(e.target.checked)}
              className="w-4 h-4 rounded border-background-border bg-background-elevated text-primary focus:ring-primary"
            />
            <label htmlFor="artifact-favorite" className="text-xs text-gray-300 cursor-pointer">
              Mark as Sanctuary Favorite (Featured in Upper Archive constellation)
            </label>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-background-border">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-background-border text-xs font-medium text-gray-400 hover:text-white hover:bg-background-surface transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-background-void font-semibold text-xs transition-colors shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="inline-block w-3 h-3 rounded-full border-2 border-background-void border-t-transparent animate-spin" />
                  Inscribing...
                </>
              ) : (
                "Seal Artifact"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
