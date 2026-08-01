"use client";
import { useState } from "react";

// ============================================================
// Exercise Selector — pick the exercise before starting
// ============================================================
export interface ExerciseOption {
  id: string;
  name: string;
  icon: string;
  description: string;
  target: string;
}

export const EXERCISE_OPTIONS: ExerciseOption[] = [
  { id: "squat", name: "Squat", icon: "🦵", description: "Leg day classic", target: "3-1-1 tempo" },
  { id: "pushup", name: "Push-Up", icon: "💪", description: "Upper body staple", target: "2-1-2 tempo" },
  { id: "plank", name: "Plank", icon: "⏱️", description: "Core endurance", target: "Hold 60s" },
];

export default function ExerciseSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {EXERCISE_OPTIONS.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onChange(opt.id)}
          className={`rounded-xl p-4 text-center border transition-all ${
            value === opt.id
              ? "bg-slate-700 border-emerald-500/60 shadow-lg"
              : "bg-slate-800/50 border-slate-700 hover:bg-slate-700/50"
          }`}
        >
          <div className="text-3xl mb-1">{opt.icon}</div>
          <p className="font-semibold text-white">{opt.name}</p>
          <p className="text-xs text-slate-400">{opt.target}</p>
        </button>
      ))}
    </div>
  );
}
