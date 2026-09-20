"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function ThresholdAuthPage() {
  const [passphrase, setPassphrase] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passphrase.trim() || isSubmitting) return;

    setError(null);
    setRetryAfter(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ passphrase }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        startTransition(() => {
          router.push(data.data?.redirect || "/");
          router.refresh();
        });
      } else {
        if (res.status === 429) {
          const retryHeader = res.headers.get("Retry-After");
          const seconds = retryHeader ? parseInt(retryHeader, 10) : 60;
          setRetryAfter(seconds);
          setError("Too many attempts. The threshold is sealed temporarily.");
        } else {
          setError(data.error?.message || "Invalid credentials");
        }
        setPassphrase("");
      }
    } catch {
      setError("Unable to reach the threshold. Check connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const loading = isSubmitting || isPending;

  return (
    <main
      className="min-h-screen w-full flex flex-col items-center justify-center relative bg-background-void overflow-hidden select-none px-6"
      role="main"
      aria-label="Sanctuary Entrance Threshold"
    >
      {/* Ambient background glow */}
      <div
        className="absolute w-[450px] h-[450px] rounded-full bg-primary/5 blur-[120px] pointer-events-none transition-opacity duration-1000"
        style={{ opacity: loading ? 0.8 : 0.4 }}
        aria-hidden="true"
      />

      <div className="z-10 w-full max-w-sm flex flex-col items-center text-center space-y-8">
        <div className="space-y-2">
          <h1 className="font-serif text-3xl sm:text-4xl text-white/90 tracking-wide font-light">
            Aethelgard
          </h1>
          <p className="font-sans text-xs sm:text-sm text-gray-500 tracking-widest uppercase">
            Private Sanctuary
          </p>
        </div>

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div className="relative flex flex-col items-center">
            <label htmlFor="passphrase-input" className="sr-only">
              Sanctuary Passphrase
            </label>
            <input
              id="passphrase-input"
              type="password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              disabled={loading}
              autoFocus
              autoComplete="off"
              spellCheck="false"
              placeholder={loading ? "Verifying..." : "Enter passphrase"}
              className={`w-full bg-background-surface/80 border text-center py-3.5 px-6 rounded-lg text-white font-sans text-sm sm:text-base placeholder-gray-600 focus:outline-none transition-all duration-300 ${
                error
                  ? "border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                  : "border-background-border focus:border-primary/60 focus:shadow-[0_0_20px_rgba(245,158,11,0.15)]"
              } ${loading ? "animate-pulse" : ""}`}
            />
          </div>

          {error && (
            <div
              className="text-xs text-red-400 font-sans tracking-wide pt-1 animate-fadeIn"
              role="alert"
            >
              {error}
              {retryAfter && (
                <span className="block text-gray-500 text-[11px] mt-1">
                  Retry available in {retryAfter}s
                </span>
              )}
            </div>
          )}

          <div className="text-[11px] text-gray-600 font-sans tracking-wider pt-2">
            Press <kbd className="px-1.5 py-0.5 rounded bg-background-elevated border border-background-border text-gray-400 font-mono text-[10px]">Enter</kbd> to unlock
          </div>
        </form>
      </div>
    </main>
  );
}
