"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

interface VoiceRecorderProps {
  onSealed?: () => void;
  className?: string;
}

export function VoiceRecorder({ onSealed, className = "" }: VoiceRecorderProps) {
  const router = useRouter();

  const [recordingState, setRecordingState] = useState<"idle" | "recording" | "review" | "saving">("idle");
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [letterTitle, setLetterTitle] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Audio Context & Analyser for real-time waveform visualization
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Clean up audio URL and contexts on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [audioUrl]);

  async function startRecording() {
    setErrorMessage(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Microphone access is not supported by your browser");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      // Determine mime type
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : "audio/webm";

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      // Initialize Web Audio API Analyser for real-time waveform visualization
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        try {
          const audioCtx = new AudioCtx();
          audioContextRef.current = audioCtx;
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          analyser.smoothingTimeConstant = 0.8;
          source.connect(analyser);
          analyserRef.current = analyser;
        } catch {
          // Fallback gracefully if AudioContext initialization is restricted
        }
      }

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const fullBlob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlob(fullBlob);
        const url = URL.createObjectURL(fullBlob);
        setAudioUrl(url);

        const now = new Date();
        const dateStr = now.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
        setLetterTitle(`Spoken Letter — ${dateStr}`);
        setRecordingState("review");

        // Stop media tracks
        stream.getTracks().forEach((track) => track.stop());

        // Close recording audio context
        if (audioContextRef.current && audioContextRef.current.state !== "closed") {
          audioContextRef.current.close().catch(() => {});
        }
      };

      mediaRecorder.start(250);
      setRecordingState("recording");
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || "Unable to access microphone");
      setRecordingState("idle");
    }
  }

  function stopRecording() {
    if (timerRef.current) clearInterval(timerRef.current);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }

  function discardRecording() {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setDuration(0);
    setRecordingState("idle");
    setErrorMessage(null);
  }

  async function handleSealVoiceLetter() {
    if (!audioBlob) return;

    setRecordingState("saving");
    setErrorMessage(null);

    try {
      // 1. Create Letter memory
      const createRes = await fetch("/api/admin/memories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "letter",
          title: letterTitle.trim() || "Spoken Voice Letter",
          bodyText: "A spoken correspondence manuscript preserved in the sanctuary.",
          memoryDate: new Date().toISOString().split("T")[0],
          emotion: "longing",
        }),
      });

      if (!createRes.ok) {
        const err = await createRes.json();
        throw new Error(err.error?.message || "Failed to create voice letter");
      }

      const { data: memData } = await createRes.json();
      const memoryId = memData.memoryId;

      // 2. Authorize audio upload
      const filename = `voice-letter-${Date.now()}.webm`;
      const uploadAuthRes = await fetch("/api/admin/media/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memoryId,
          filename,
          contentType: audioBlob.type || "audio/webm",
          sizeBytes: audioBlob.size,
          isPrimary: true,
        }),
      });

      if (!uploadAuthRes.ok) {
        const authErr = await uploadAuthRes.json();
        throw new Error(authErr.error?.message || "Failed to authorize audio upload");
      }

      const { data: authData } = await uploadAuthRes.json();
      const { uploadUrl, assetId } = authData;

      // 3. Direct binary upload via PUT
      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": audioBlob.type || "audio/webm" },
        body: audioBlob,
      });

      if (!putRes.ok) {
        throw new Error("Direct audio upload failed");
      }

      // 4. Finalize media completion
      await fetch(`/api/admin/media/${assetId}/complete`, { method: "POST" });

      discardRecording();
      if (onSealed) onSealed();
      router.refresh();
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || "Failed to seal voice letter");
      setRecordingState("review");
    }
  }

  function formatDuration(sec: number) {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  // Real-time canvas waveform rendering loop
  useEffect(() => {
    if (recordingState !== "recording") {
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

    const analyser = analyserRef.current;
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

      const barCount = 14;
      const barWidth = width / barCount - 1.5;
      let x = 1;

      for (let i = 0; i < barCount; i++) {
        const val = dataArray[i] || 0;
        const normalized = Math.min(1, Math.max(0.12, val / 220));
        const barHeight = normalized * (height - 2);

        const gradient = ctx.createLinearGradient(0, height, 0, 0);
        gradient.addColorStop(0, "rgba(245, 158, 11, 0.4)");
        gradient.addColorStop(1, "rgba(251, 191, 36, 0.95)");

        ctx.fillStyle = gradient;
        ctx.fillRect(x, height - barHeight, barWidth, barHeight);
        x += barWidth + 1.5;
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
  }, [recordingState]);

  return (
    <div className={`p-4 rounded-xl border border-amber-900/40 bg-background-elevated/40 backdrop-blur-sm space-y-3 ${className}`}>
      {errorMessage && (
        <div className="p-2.5 rounded-lg border border-red-500/30 bg-red-950/20 text-xs text-red-300">
          {errorMessage}
        </div>
      )}

      {recordingState === "idle" && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-amber-950/40 border border-amber-700/40 flex items-center justify-center text-amber-300 text-sm">
              🎙️
            </div>
            <div>
              <div className="text-xs font-semibold text-amber-200">Record Spoken Letter</div>
              <div className="text-[10px] text-gray-400">Leave an intimate voice memo manuscript</div>
            </div>
          </div>
          <button
            type="button"
            onClick={startRecording}
            className="px-3 py-1.5 rounded-lg bg-amber-900/30 border border-amber-700/50 hover:bg-amber-800/40 text-amber-200 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-primary flex items-center gap-1.5"
          >
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>Record</span>
          </button>
        </div>
      )}

      {recordingState === "recording" && (
        <div className="flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
            </span>
            <span className="font-mono text-xs font-semibold text-rose-300">
              Recording {formatDuration(duration)}
            </span>
            {/* Live Audio Spectrum Waveform Canvas */}
            <canvas
              ref={canvasRef}
              width={100}
              height={24}
              className="w-24 h-6 rounded bg-background-void/60 border border-amber-900/30 px-1"
              aria-label="Real-time voice waveform visualization"
            />
          </div>
          <button
            type="button"
            onClick={stopRecording}
            className="px-3.5 py-1.5 rounded-lg bg-rose-950/40 border border-rose-700/50 hover:bg-rose-900/50 text-rose-200 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-primary"
          >
            Stop
          </button>
        </div>
      )}

      {recordingState === "review" && (
        <div className="space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-200">Review Spoken Manuscript</span>
            <span className="font-mono text-xs text-gray-400">{formatDuration(duration)}</span>
          </div>

          {audioUrl && (
            <audio src={audioUrl} controls className="w-full h-8 rounded-lg outline-none" />
          )}

          <div>
            <label htmlFor="voice-letter-title" className="block text-[11px] text-gray-400 mb-1">
              Letter Title
            </label>
            <input
              id="voice-letter-title"
              type="text"
              value={letterTitle}
              onChange={(e) => setLetterTitle(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-background-border bg-background-elevated text-xs text-white placeholder-gray-500 focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={discardRecording}
              className="px-3 py-1.5 rounded-lg border border-background-border text-xs text-gray-400 hover:text-white transition-colors"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={handleSealVoiceLetter}
              className="px-3.5 py-1.5 rounded-lg bg-amber-800/40 border border-amber-600/50 hover:bg-amber-700/50 text-amber-100 text-xs font-semibold transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-primary"
            >
              Seal Voice Letter
            </button>
          </div>
        </div>
      )}

      {recordingState === "saving" && (
        <div className="flex items-center justify-center py-2 gap-2 text-xs text-amber-300">
          <span className="inline-block w-3 h-3 rounded-full border-2 border-amber-300 border-t-transparent animate-spin" />
          <span>Sealing spoken manuscript in Correspondence vault...</span>
        </div>
      )}
    </div>
  );
}
