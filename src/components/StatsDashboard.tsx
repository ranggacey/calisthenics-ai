"use client";
import { useEffect, useState } from "react";

// ============================================================
// Stats Dashboard — reads workout stats from localStorage
// ============================================================
import { loadStats, type WorkoutStats } from "@/lib/storage";

const STREAK_GOAL = 7;
const TOTAL_REP_GOAL = 500;

export default function StatsDashboard() {
  const [stats, setStats] = useState<WorkoutStats>(loadStats);

  useEffect(() => {
    const onStorage = () => setStats(loadStats());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const streakPct = Math.min(100, Math.round((stats.streak / STREAK_GOAL) * 100));
  const totalPct = Math.min(100, Math.round((stats.totalReps / TOTAL_REP_GOAL) * 100));

  return (
    <div className="w-full rounded-2xl bg-slate-900/80 border border-slate-700 p-6">
      <h2 className="text-xl font-bold text-white mb-4">📊 Progress Dashboard</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Reps" value={stats.totalReps.toLocaleString()} sub={`Goal ${TOTAL_REP_GOAL}`} pct={totalPct} />
        <StatCard label="Workouts" value={stats.totalWorkouts.toLocaleString()} sub="sessions" />
        <StatCard label="Streak" value={`${stats.streak}d`} sub={`Goal ${STREAK_GOAL}d`} pct={streakPct} />
        <StatCard label="Best Set" value={stats.bestSet.toLocaleString()} sub="reps" />
      </div>
      {Object.keys(stats.byExercise).length > 0 && (
        <div className="mt-4">
          <p className="text-sm text-slate-400 mb-2">By exercise</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.byExercise).map(([id, count]) => (
              <span key={id} className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-sm">
                {id}: {count}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, sub, pct }: { label: string; value: string; sub?: string; pct?: number }) {
  return (
    <div className="rounded-xl bg-slate-800 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-slate-500">{sub}</p>}
      {typeof pct === "number" && (
        <div className="mt-2 h-1.5 w-full rounded-full bg-slate-700 overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400" style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
}
