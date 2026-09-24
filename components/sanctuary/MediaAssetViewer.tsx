"use client";

import type { SafeMemoryAsset } from "@/lib/data/memories";
import { MediaViewer } from "@/components/media/MediaViewer";

interface MediaAssetViewerProps {
  asset: SafeMemoryAsset;
}

export function MediaAssetViewer({ asset }: MediaAssetViewerProps) {
  return <MediaViewer asset={asset} />;
}

