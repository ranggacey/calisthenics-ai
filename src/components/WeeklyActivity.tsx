"use client";
import { useEffect, useState } from "react";
import { localDateKey } from "@/lib/storage";

// ============================================================
// Weekly Activity — 7-day bar chart dari session history
// (label hari pakai waktu LOKAL, bukan UTC)
// ============================================================
interface SessionRecord {
  date: string;
  exercise: string;
  reps: number;
  duration: number;
}

const KEY = "cali_history";

export default function WeeklyActivity() {
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

  // Build last-7-days buckets (tanggal lokal)
  const days: { label: string; reps: number; mins: number }[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = localDateKey(d);
    const dayRecords = records.filter((r) => localDateKey(new Date(r.date)) === key);
    const reps = dayRecords.reduce((a, r) => a + r.reps, 0);
    const mins = Math.round(dayRecords.reduce((a, r) => a + r.duration, 0) / 60);
    days.push({ label: d.toLocaleDateString(undefined, { weekday: "short" }), reps, mins });
  }

  const max = Math.max(1, ...days.map((d) => d.reps));

  return (
    <div className="w-full rounded-2xl bg-slate-900/80 border border-slate-700 p-6">
      <h2 className="text-xl font-bold text-white mb-4">📅 Weekly Activity</h2>
      <div className="flex items-end justify-between gap-2 h-32">
        {days.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-xs font-mono text-slate-400">
              {d.reps > 0 ? d.reps : d.mins > 0 ? `${d.mins}m` : ""}
            </span>
            <div
              className={`w-full rounded-t-md ${d.reps > 0 ? "bg-gradient-to-t from-emerald-600 to-emerald-400" : "bg-slate-800"}`}
              style={{ height: `${Math.max(6, (d.reps / max) * 100)}%` }}
            />
            <span className="text-[10px] text-slate-500">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
