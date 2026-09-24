"use client";

import { useState, useEffect, useRef } from "react";
import { ambientEngine } from "@/lib/audio/ambientEngine";

interface AmbientSoundscapeProps {
  className?: string;
}

export function AmbientSoundscape({ className = "" }: AmbientSoundscapeProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.25);
  const [isOpen, setIsOpen] = useState(false);
  const [hasStartedOnce, setHasStartedOnce] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close popover on Escape or outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Waveform rendering loop on canvas
  useEffect(() => {
    if (!isPlaying || !isOpen) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const analyser = ambientEngine.getAnalyser();
    if (!analyser) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      const barCount = 18;
      const barWidth = (width / barCount) - 2;
      let x = 1;

      for (let i = 0; i < barCount; i++) {
        // Sample frequency band with gentle scaling
        const dataIndex = Math.floor((i / barCount) * (bufferLength / 2));
        const rawValue = dataArray[dataIndex] || 0;
        const normalized = Math.min(1, Math.max(0.08, rawValue / 180));
        const barHeight = normalized * (height - 4);

        // Warm celestial gradient
        const gradient = ctx.createLinearGradient(0, height, 0, 0);
        gradient.addColorStop(0, "rgba(180, 140, 80, 0.4)");
        gradient.addColorStop(1, "rgba(230, 200, 130, 0.95)");

        ctx.fillStyle = gradient;
        ctx.fillRect(x, height - barHeight, barWidth, barHeight);

        x += barWidth + 2;
      }

      if (prefersReducedMotion) {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
      }
    };

    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isPlaying, isOpen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      ambientEngine.stop();
    };
  }, []);

  const toggleSoundscape = async () => {
    if (isPlaying) {
      await ambientEngine.stop();
      setIsPlaying(false);
    } else {
      await ambientEngine.start(volume);
      setIsPlaying(true);
      setHasStartedOnce(true);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setVolume(val);
    ambientEngine.setVolume(val);
  };

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen((prev) => !prev);
          if (!hasStartedOnce && !isPlaying) {
            toggleSoundscape();
          }
        }}
        aria-expanded={isOpen}
        aria-label={`Atmospheric Soundscape: ${isPlaying ? "Playing" : "Muted"}`}
        title={`Atmospheric Soundscape (${isPlaying ? "Playing" : "Muted"})`}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary ${
          isPlaying
            ? "bg-amber-950/40 border-amber-600/60 text-amber-200 shadow-sm shadow-amber-950/40"
            : "bg-background-surface border-background-border/70 text-gray-400 hover:text-gray-200 hover:bg-background-elevated"
        }`}
      >
        {/* Animated Sound Wave / Chime Icon */}
        <span className="flex items-center gap-0.5 h-3" aria-hidden="true">
          <span
            className={`w-0.5 rounded-full bg-current transition-all duration-300 ${
              isPlaying ? "h-3 animate-pulse" : "h-1 opacity-60"
            }`}
          />
          <span
            className={`w-0.5 rounded-full bg-current transition-all duration-300 ${
              isPlaying ? "h-2 animate-pulse delay-75" : "h-2 opacity-60"
            }`}
          />
          <span
            className={`w-0.5 rounded-full bg-current transition-all duration-300 ${
              isPlaying ? "h-3.5 animate-pulse delay-150" : "h-1 opacity-60"
            }`}
          />
        </span>
        <span className="hidden sm:inline text-[11px] font-mono tracking-wide">
          {isPlaying ? "Ambient" : "Sound"}
        </span>
      </button>

      {/* Popover Panel */}
      {isOpen && (
        <div
          role="region"
          aria-label="Soundscape Controls"
          className="absolute right-0 mt-2 w-64 rounded-xl border border-amber-900/50 bg-background-surface/95 p-4 shadow-2xl backdrop-blur-xl z-50 space-y-4 animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="flex items-center justify-between border-b border-background-border/60 pb-2">
            <div>
              <h3 className="font-serif text-sm font-semibold text-white">
                Sanctuary Atmosphere
              </h3>
              <p className="text-[10px] text-gray-400 font-mono">
                Procedural Celestial Drone
              </p>
            </div>
            <button
              type="button"
              onClick={toggleSoundscape}
              aria-label={isPlaying ? "Silence soundscape" : "Start soundscape"}
              className={`px-2.5 py-1 rounded text-xs font-mono font-medium border transition-colors ${
                isPlaying
                  ? "bg-amber-950/60 border-amber-600/70 text-amber-200 hover:bg-amber-900/60"
                  : "bg-background-elevated border-background-border text-gray-300 hover:text-white"
              }`}
            >
              {isPlaying ? "Mute" : "Begin"}
            </button>
          </div>

          {/* Real-time Spectrum Waveform */}
          <div className="rounded-lg border border-background-border bg-background-void/80 p-2 text-center">
            {isPlaying ? (
              <canvas
                ref={canvasRef}
                width={220}
                height={40}
                className="w-full h-10 block rounded"
                aria-label="Real-time soundscape waveform visualization"
              />
            ) : (
              <div className="h-10 flex items-center justify-center text-[11px] text-gray-500 font-mono">
                Atmosphere is silent
              </div>
            )}
          </div>

          {/* Volume Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-gray-300">
              <span className="text-[11px] text-gray-400">Volume</span>
              <span className="font-mono text-[11px] text-amber-300">
                {Math.round(volume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={handleVolumeChange}
              disabled={!isPlaying}
              aria-label="Ambient volume slider"
              className="w-full h-1.5 rounded-lg appearance-none bg-background-void accent-amber-500 cursor-pointer disabled:opacity-40"
            />
          </div>

          <p className="text-[10px] text-gray-500 italic leading-tight text-center">
            Harmonized in resonant fifths to anchor contemplative presence.
          </p>
        </div>
      )}
    </div>
  );
}
