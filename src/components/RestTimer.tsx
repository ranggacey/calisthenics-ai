"use client";
import { useEffect, useState } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";

// ============================================================
// Rest Timer — configurable rest period between sets
// ============================================================
const PRESETS = [
  { label: "30s", seconds: 30 },
  { label: "60s", seconds: 60 },
  { label: "90s", seconds: 90 },
  { label: "2m", seconds: 120 },
  { label: "3m", seconds: 180 },
];

export default function RestTimer() {
  const [seconds, setSeconds] = useState(() => {
    if (typeof window === "undefined") return 60;
    return Number(localStorage.getItem("cali_rest_timer")) || 60;
  });
  const [remaining, setRemaining] = useState(seconds);
  const [isRunning, setIsRunning] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);

  useEffect(() => {
    localStorage.setItem("cali_rest_timer", String(seconds));
  }, [seconds]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isRunning && remaining > 0 && startedAt) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startedAt) / 1000);
        const next = Math.max(0, seconds - elapsed);
        setRemaining(next);
        if (next === 0) {
          setIsRunning(false);
          setStartedAt(null);
          if (interval) clearInterval(interval);
          // Play completion sound
          if (typeof window !== "undefined" && localStorage.getItem("cali_sound") !== "off") {
            try {
              const ctx = new AudioContext();
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.frequency.value = 660;
              osc.type = "sine";
              gain.gain.setValueAtTime(0.15, ctx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
              osc.connect(gain).connect(ctx.destination);
              osc.start();
              osc.stop(ctx.currentTime + 0.5);
            } catch {
              /* ignore */
            }
          }
          if (typeof window !== "undefined" && localStorage.getItem("cali_haptic") !== "off" && "vibrate" in navigator) {
            navigator.vibrate([100, 50, 100]);
          }
        }
      }, 200);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, remaining, seconds, startedAt]);

  const start = () => {
    setIsRunning(true);
    setStartedAt(Date.now());
  };

  const pause = () => {
    setIsRunning(false);
    setStartedAt(null);
  };

  const reset = () => {
    setIsRunning(false);
    setStartedAt(null);
    setRemaining(seconds);
  };

  // When preset changes while idle, sync display
  const selectPreset = (s: number) => {
    setSeconds(s);
    if (!isRunning) setRemaining(s);
  };

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const progress = seconds > 0 ? (remaining / seconds) * 100 : 0;

  return (
    <div className="w-full rounded-2xl bg-slate-900/80 border border-slate-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">⏱️ Rest Timer</h2>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => selectPreset(p.seconds)}
            className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-all ${
              seconds === p.seconds
                ? "bg-emerald-600 text-white shadow-lg"
                : "bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="relative mb-4">
        <div className="h-3 w-full rounded-full bg-slate-700 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-200"
            style={{ width: `${100 - progress}%` }}
          />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-3xl font-mono font-bold text-white">{mm}:{ss}</p>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={isRunning ? pause : start}
          disabled={remaining === 0 && !isRunning}
          className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
            isRunning
              ? "bg-amber-600 hover:bg-amber-500 text-white"
              : "bg-emerald-600 hover:bg-emerald-500 text-white"
          } disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          <span className="flex items-center justify-center gap-2">
            {isRunning ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            {isRunning ? "Pause" : remaining === seconds ? "Start" : "Resume"}
          </span>
        </button>
        <button
          onClick={reset}
          disabled={remaining === seconds && !isRunning}
          className="px-6 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <RotateCcw className="h-5 w-5" />
          Reset
        </button>
      </div>
    </div>
  );
}