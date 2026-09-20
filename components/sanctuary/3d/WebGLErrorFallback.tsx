"use client";

import React from "react";

interface WebGLErrorFallbackProps {
  errorMessage: string | null;
  circuitBreakerTripped?: boolean;
  onReturnTo2D: () => void;
  onRetry?: () => void;
}

export function WebGLErrorFallback({
  errorMessage,
  circuitBreakerTripped = false,
  onReturnTo2D,
  onRetry,
}: WebGLErrorFallbackProps) {
  return (
    <div
      role="alert"
      aria-live="polite"
      className="rounded-2xl border border-amber-900/40 bg-background-surface/90 p-8 backdrop-blur-md max-w-xl mx-auto my-8 text-center shadow-2xl"
    >
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-950/60 border border-amber-700/50 text-amber-400 mb-4 text-xl">
        ⚠
      </div>

      <h2 className="font-serif text-2xl font-semibold text-white tracking-tight">
        Spatial Visualization Unavailable
      </h2>

      <p className="mt-3 text-sm text-gray-300 leading-relaxed">
        {errorMessage ||
          "WebGL hardware acceleration could not be initialized on this display or browser environment."}
      </p>

      {circuitBreakerTripped && (
        <p className="mt-2 text-xs font-mono text-amber-400/90 bg-amber-950/40 py-1.5 px-3 rounded-md border border-amber-900/30 inline-block">
          Safety Circuit Breaker Active &bull; 3D Disabled for Session
        </p>
      )}

      <p className="mt-4 text-xs text-gray-400">
        The complete sanctuary archive, memory details, correspondence, and timeline
        remain 100% accessible via the standard 2D view and semantic navigation below.
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={onReturnTo2D}
          className="px-5 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-primary shadow-lg"
        >
          Return to 2D Sanctuary
        </button>

        {!circuitBreakerTripped && onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="px-4 py-2.5 rounded-lg border border-background-border hover:bg-background-elevated text-gray-300 hover:text-white text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-primary"
          >
            Attempt Recovery
          </button>
        )}
      </div>
    </div>
  );
}
