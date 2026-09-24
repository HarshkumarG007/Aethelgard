"use client";

import React, { useState, useEffect, useRef } from "react";
import type { SafeMemoryAsset } from "@/lib/data/memories";

interface MediaViewerProps {
  asset: SafeMemoryAsset;
  initialVariant?: "thumbnail" | "small" | "medium" | "large";
  className?: string;
}

export function MediaViewer({
  asset,
  initialVariant = "medium",
  className = "",
}: MediaViewerProps) {
  const [selectedVariant, setSelectedVariant] = useState<"thumbnail" | "small" | "medium" | "large">(
    initialVariant
  );
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(asset.durationSeconds || 0);

  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Request ephemeral presigned GET access token (5-min lifetime)
  async function fetchMediaUrl(variant: string) {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/media/access", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assetId: asset.id,
          variant,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || "Media authorization failed");
      }

      setMediaUrl(data.data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to authorize media");
    } finally {
      setIsLoading(false);
    }
  }

  // Handle lightbox keyboard Escape
  useEffect(() => {
    if (!isLightboxOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsLightboxOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLightboxOpen]);

  // Format MM:SS for media players
  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  }

  return (
    <div
      className={`rounded-2xl border border-background-border bg-background-surface/80 p-5 shadow-xl backdrop-blur-md space-y-4 ${className}`}
    >
      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-mono text-primary-light font-bold uppercase text-[11px] px-2.5 py-1 rounded bg-background-elevated border border-primary/30 tracking-wider">
            {asset.type}
          </span>
          <span className="text-gray-200 font-serif font-medium truncate max-w-[240px]">
            {asset.filename}
          </span>
        </div>
        <div className="text-gray-400 text-[11px] font-mono flex items-center gap-3">
          <span>{(asset.sizeBytes / 1024).toFixed(1)} KB</span>
          <span className="inline-block w-1 h-1 rounded-full bg-gray-600" />
          <span
            className={`font-semibold ${
              asset.status === "READY"
                ? "text-emerald-400"
                : asset.status === "FAILED"
                ? "text-red-400"
                : "text-amber-400"
            }`}
          >
            {asset.status}
          </span>
        </div>
      </div>

      {/* Main Presentation Surface */}
      {mediaUrl ? (
        <div className="space-y-4">
          {/* IMAGE VIEWER */}
          {asset.type === "image" && (
            <div className="space-y-3">
              <div
                className="relative group rounded-xl overflow-hidden border border-background-border/80 bg-background-void flex items-center justify-center min-h-[220px] max-h-[550px] cursor-zoom-in"
                onClick={() => setIsLightboxOpen(true)}
                title="Click to view full screen"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    setIsLightboxOpen(true);
                  }
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={mediaUrl}
                  alt={asset.filename}
                  className="max-h-[550px] w-auto max-w-full object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                />
                <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-md bg-black/70 backdrop-blur border border-white/10 text-[10px] text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 font-mono">
                  <span>Zoom / Fullscreen</span>
                  <span aria-hidden="true">&;</span>
                </div>
              </div>

              {/* Variant Selector */}
              {asset.availableVariants && asset.availableVariants.length > 0 && (
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-gray-400 text-[11px]">Variant:</span>
                  <div className="flex items-center gap-1.5">
                    {(["thumbnail", "small", "medium", "large"] as const).map((v) => {
                      const isAvail = asset.availableVariants.includes(v);
                      return (
                        <button
                          key={v}
                          type="button"
                          disabled={!isAvail || isLoading}
                          onClick={() => {
                            setSelectedVariant(v);
                            fetchMediaUrl(v);
                          }}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase transition-colors ${
                            selectedVariant === v
                              ? "bg-primary/30 border border-primary text-primary-light font-semibold"
                              : isAvail
                              ? "bg-background-elevated text-gray-400 hover:text-white border border-background-border"
                              : "opacity-30 cursor-not-allowed text-gray-600 border border-transparent"
                          }`}
                        >
                          {v}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* AUDIO PLAYER */}
          {asset.type === "audio" && (
            <div className="p-4 rounded-xl border border-background-border bg-background-elevated/70 space-y-3">
              <audio
                ref={audioRef}
                src={mediaUrl}
                onTimeUpdate={() => {
                  if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
                }}
                onLoadedMetadata={() => {
                  if (audioRef.current) setDuration(audioRef.current.duration);
                }}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
                className="hidden"
              />

              {/* Ethereal Audio Waveform Track */}
              <div
                className="h-12 w-full rounded-lg bg-background-void/60 border border-background-border/70 px-3 py-2 flex items-center justify-between gap-1 overflow-hidden"
                aria-label="Audio waveform visualizer"
              >
                {Array.from({ length: 32 }).map((_, i) => {
                  const progress = duration > 0 ? currentTime / duration : 0;
                  const isPassed = i / 32 <= progress;
                  // Organic waveform height pattern
                  const wavePattern = [25, 45, 70, 90, 60, 40, 80, 100, 75, 50, 85, 95, 65, 35, 55, 80, 90, 65, 45, 75, 95, 60, 40, 85, 100, 70, 50, 65, 85, 55, 35, 20];
                  const barPercent = wavePattern[i % wavePattern.length];

                  return (
                    <span
                      key={i}
                      style={{ height: `${barPercent}%` }}
                      className={`w-1.5 rounded-full transition-all duration-200 ${
                        isPassed
                          ? "bg-primary-light shadow-sm shadow-primary/50"
                          : "bg-gray-700/50"
                      } ${isPlaying && isPassed ? "animate-pulse" : ""}`}
                    />
                  );
                })}
              </div>

              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => {
                    if (!audioRef.current) return;
                    if (isPlaying) {
                      audioRef.current.pause();
                    } else {
                      audioRef.current.play();
                    }
                  }}
                  className="w-10 h-10 rounded-full bg-primary/20 border border-primary/50 text-primary-light flex items-center justify-center hover:bg-primary/30 transition-colors focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label={isPlaying ? "Pause audio" : "Play audio"}
                >
                  {isPlaying ? (
                    <span className="font-bold text-xs" aria-hidden="true">
                      ❚❚
                    </span>
                  ) : (
                    <span className="font-bold text-xs ml-0.5" aria-hidden="true">
                      ▶
                    </span>
                  )}
                </button>

                <div className="flex-1 space-y-1.5">
                  <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    value={currentTime}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setCurrentTime(val);
                      if (audioRef.current) audioRef.current.currentTime = val;
                    }}
                    className="w-full h-1.5 rounded-lg appearance-none bg-background-void accent-primary cursor-pointer"
                    aria-label="Audio scrubber"
                  />
                  <div className="flex justify-between text-[11px] font-mono text-gray-400">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIDEO PLAYER */}
          {asset.type === "video" && (
            <div className="rounded-xl overflow-hidden border border-background-border bg-black aspect-video flex items-center justify-center">
              <video
                ref={videoRef}
                src={mediaUrl}
                controls
                playsInline
                className="w-full h-full object-contain"
              >
                Your browser does not support HTML5 video playback.
              </video>
            </div>
          )}

          {/* DOCUMENT / OTHER */}
          {asset.type === "document" && (
            <div className="p-6 rounded-xl border border-background-border bg-background-elevated/40 text-center space-y-3">
              <p className="text-xs text-gray-300">Secure relationship archive manuscript</p>
              <a
                href={mediaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/20 border border-primary/40 text-primary-light text-xs font-medium hover:bg-primary/30 transition-colors"
              >
                Inspect Document &rarr;
              </a>
            </div>
          )}
        </div>
      ) : (
        /* Ephemeral Token Authorization Trigger */
        <div className="flex items-center justify-between pt-2">
          {error ? (
            <span className="text-xs text-red-400">{error}</span>
          ) : (
            <span className="text-xs text-gray-400 italic">
              Encrypted private artifact &bull; Single-session ephemeral key
            </span>
          )}

          <button
            type="button"
            onClick={() => fetchMediaUrl(selectedVariant)}
            disabled={isLoading || asset.status !== "READY"}
            className="px-3.5 py-1.5 rounded-lg bg-background-elevated border border-background-border text-xs font-medium text-primary-light hover:bg-background-border hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-40"
          >
            {isLoading
              ? "Authorizing..."
              : asset.status !== "READY"
              ? "Processing..."
              : "Reveal Artifact"}
          </button>
        </div>
      )}

      {/* FULLSCREEN LIGHTBOX MODAL */}
      {isLightboxOpen && mediaUrl && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={asset.filename}
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200"
          onClick={() => setIsLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm transition-colors focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Close Lightbox"
          >
            ✕
          </button>

          <div
            className="relative max-w-6xl max-h-[90vh] overflow-hidden flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={mediaUrl}
              alt={asset.filename}
              className="max-h-[85vh] w-auto max-w-full object-contain rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
