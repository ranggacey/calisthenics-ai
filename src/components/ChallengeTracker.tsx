"use client";
import { useState } from "react";

// ============================================================
// Challenge Tracker — seasonal challenge with live progress
// ============================================================
export default function ChallengeTracker() {
  const [progress, setProgress] = useState(138);

  const goal = 250;
  const pct = Math.min(100, Math.round((progress / goal) * 100));

  return (
    <div className="w-full rounded-2xl bg-gradient-to-br from-amber-900/40 to-slate-900 border border-amber-500/40 p-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-bold text-amber-300">🔥 Season 1: Push-Up Mastery</h2>
        <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold uppercase">
          Limited Time
        </span>
      </div>
      <p className="text-slate-400 text-sm mb-4">
        Complete {goal} push-ups before Aug 31, 2026. Reward: Golden Push-Up Badge 🏅
      </p>
      <div className="flex justify-between text-sm text-slate-300 mb-2">
        <span className="font-mono">{progress} / {goal} push-ups</span>
        <span className="font-bold text-amber-300">{pct}%</span>
      </div>
      <div className="h-3 w-full rounded-full bg-slate-700 overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-300" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
