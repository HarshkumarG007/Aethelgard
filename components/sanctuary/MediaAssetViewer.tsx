"use client";

import { useState } from "react";
import type { SafeMemoryAsset } from "@/lib/data/memories";

interface MediaAssetViewerProps {
  asset: SafeMemoryAsset;
}

export function MediaAssetViewer({ asset }: MediaAssetViewerProps) {
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function requestMediaAccess(variant: string = "medium") {
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
      setError(err instanceof Error ? err.message : "Failed to load media");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-background-border bg-background-surface/90 p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-mono text-primary-light uppercase text-[10px] px-2 py-0.5 rounded bg-background-elevated border border-background-border">
            {asset.type}
          </span>
          <span className="text-gray-300 font-medium truncate max-w-[200px]">
            {asset.filename}
          </span>
        </div>
        <div className="text-gray-500 text-[11px] font-mono">
          {(asset.sizeBytes / 1024).toFixed(1)} KB &bull; Status: {asset.status}
        </div>
      </div>

      {/* Media display area */}
      {mediaUrl ? (
        <div className="mt-2 rounded-lg overflow-hidden border border-background-border bg-background-void flex items-center justify-center min-h-[160px]">
          {asset.type === "image" && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mediaUrl}
              alt={asset.filename}
              className="max-h-[500px] w-auto max-w-full object-contain"
            />
          )}
          {asset.type === "audio" && (
            <audio controls className="w-full p-4">
              <source src={mediaUrl} type={asset.mimeType} />
              Your browser does not support the audio element.
            </audio>
          )}
          {asset.type !== "image" && asset.type !== "audio" && (
            <a
              href={mediaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary-light underline p-4"
            >
              Open {asset.filename} in secure viewer
            </a>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between pt-2">
          {error ? (
            <span className="text-xs text-red-400">{error}</span>
          ) : (
            <span className="text-xs text-gray-400">
              Private object storage &bull; Requires ephemeral token
            </span>
          )}

          <button
            type="button"
            onClick={() => requestMediaAccess("medium")}
            disabled={isLoading || asset.status !== "READY"}
            className="px-3 py-1.5 rounded-lg bg-background-elevated border border-background-border text-xs font-medium text-primary-light hover:bg-background-border hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-40"
          >
            {isLoading
              ? "Authorizing..."
              : asset.status !== "READY"
              ? "Processing"
              : "Reveal Artifact"}
          </button>
        </div>
      )}
    </div>
  );
}
