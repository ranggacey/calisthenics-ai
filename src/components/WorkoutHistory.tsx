"use client";
import { useEffect, useState } from "react";
import { loadHistory, type SessionRecord } from "@/lib/storage";

// ============================================================
// Workout History — recent sessions from localStorage
// ============================================================

export default function WorkoutHistory() {
  const [records, setRecords] = useState<SessionRecord[]>([]);

  useEffect(() => {
    const load = () => setRecords(loadHistory());
    load();
    window.addEventListener("storage", load);
    return () => window.removeEventListener("storage", load);
  }, []);

  if (records.length === 0) {
    return (
      <div className="w-full rounded-2xl bg-slate-900/80 border border-slate-700 p-6">
        <h2 className="text-xl font-bold text-white mb-2">🕘 Workout History</h2>
        <p className="text-slate-500 text-sm">No sessions yet — go crush one!</p>
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl bg-slate-900/80 border border-slate-700 p-6">
      <h2 className="text-xl font-bold text-white mb-4">🕘 Workout History</h2>
      <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {[...records].reverse().map((r, i) => (
          <li key={i} className="flex items-center justify-between rounded-lg bg-slate-800 px-4 py-2 text-sm">
            <span className="text-slate-300 font-medium capitalize">{r.exercise}</span>
            <span className="text-slate-400">
              {new Date(r.date).toLocaleDateString()} {new Date(r.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
            <span className="font-mono text-white">{r.reps} reps</span>
            <span className="font-mono text-slate-500">{Math.floor(r.duration / 60)}:{String(r.duration % 60).padStart(2, "0")}m</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
