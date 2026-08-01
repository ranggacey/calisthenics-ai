"use client";
import { useEffect, useState } from "react";

// ============================================================
// Workout History — recent sessions from localStorage
// ============================================================
interface SessionRecord {
  date: string;
  exercise: string;
  reps: number;
  duration: number;
}

const KEY = "cali_history";

export function logSession(exercise: string, reps: number, duration: number) {
  try {
    const raw = localStorage.getItem(KEY);
    const list: SessionRecord[] = raw ? JSON.parse(raw) : [];
    list.push({ date: new Date().toISOString(), exercise, reps, duration });
    localStorage.setItem(KEY, JSON.stringify(list.slice(-50)));
  } catch {
    /* ignore */
  }
}

export default function WorkoutHistory() {
  const [records, setRecords] = useState<SessionRecord[]>([]);

  useEffect(() => {
    const load = () => {
      try {
        const raw = localStorage.getItem(KEY);
        setRecords(raw ? (JSON.parse(raw) as SessionRecord[]) : []);
      } catch {
        setRecords([]);
      }
    };
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
            <span className="text-slate-400">{new Date(r.date).toLocaleDateString()} {new Date(r.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
            <span className="font-mono text-white">{r.reps} reps</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
