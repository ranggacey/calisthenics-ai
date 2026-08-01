"use client";
import { useEffect, useState } from "react";
import { loadChallenge, writeJson, CHALLENGE_KEY } from "@/lib/storage";
import { seasonalChallenge } from "@/lib/challenges";

// ============================================================
// Challenge Tracker — seasonal challenge, progress dari localStorage
// Mulai dari 0, naik tiap push-up/squat/plank yang kehitung.
// ============================================================
const GOAL = seasonalChallenge.goalCount;

export default function ChallengeTracker() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const load = () => {
      const c = loadChallenge();
      setCount(c.count);
    };
    load();
    const onStorage = () => load();
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Reset challenge ke 0 (kalau user mau mulai dari awal)
  const resetChallenge = () => {
    writeJson(CHALLENGE_KEY, { exercise: "pushup", count: 0 });
    setCount(0);
  };

  const pct = Math.min(100, Math.round((count / GOAL) * 100));

  return (
    <div className="w-full rounded-2xl bg-gradient-to-br from-amber-900/40 to-slate-900 border border-amber-500/40 p-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-bold text-amber-300">🔥 Season 1: Push-Up Mastery</h2>
        <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold uppercase">
          Limited Time
        </span>
      </div>
      <p className="text-slate-400 text-sm mb-4">
        Complete {GOAL} push-ups before Aug 31, 2026. Reward: Golden Push-Up Badge 🏅
      </p>
      <div className="flex justify-between text-sm text-slate-300 mb-2">
        <span className="font-mono">{count} / {GOAL} push-ups</span>
        <span className="font-bold text-amber-300">{pct}%</span>
      </div>
      <div className="h-3 w-full rounded-full bg-slate-700 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-300 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      {count >= GOAL && (
        <p className="mt-3 text-center font-bold text-amber-300">
          🏅 Challenge complete! You earned the Golden Push-Up Badge!
        </p>
      )}
      <button
        onClick={resetChallenge}
        className="mt-4 text-xs text-slate-500 hover:text-slate-300 underline underline-offset-2"
      >
        Reset challenge progress
      </button>
    </div>
  );
}
