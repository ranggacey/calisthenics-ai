"use client";
import { useEffect, useState } from "react";
import { loadDailyLog, type DailyLog } from "@/lib/storage";

// ============================================================
// Daily Quests — refresh every day, track TODAY'S reps only.
// Progress murni dari cali_daily (log harian), bukan all-time.
// ============================================================
interface QuestDef {
  id: string;
  title: string;
  description: string;
  icon: string;
  goal: number;
  metric: "reps" | "workouts";
  exercise?: string;
}

const QUESTS: QuestDef[] = [
  { id: "q-squat", title: "Squat Day", description: "Do 50 squats today", icon: "🦵", goal: 50, metric: "reps", exercise: "squat" },
  { id: "q-pushup", title: "Push-Up Hour", description: "Do 30 push-ups today", icon: "💪", goal: 30, metric: "reps", exercise: "pushup" },
  { id: "q-plank", title: "Plank Time", description: "1 minute of plank today", icon: "⏱️", goal: 60, metric: "reps", exercise: "plank" },
  { id: "q-workout", title: "Show Up", description: "Complete 1 workout today", icon: "🏋️", goal: 1, metric: "workouts" },
];

export default function DailyQuests() {
  const [log, setLog] = useState<DailyLog>(loadDailyLog);

  useEffect(() => {
    const refresh = () => setLog(loadDailyLog());
    refresh();
    window.addEventListener("storage", refresh);
    return () => window.removeEventListener("storage", refresh);
  }, []);

  const progressFor = (q: QuestDef): number => {
    if (q.metric === "workouts") return Math.min(log.workouts, q.goal);
    if (q.exercise) return Math.min(log.byExercise[q.exercise] ?? 0, q.goal);
    return 0;
  };

  const completed = QUESTS.filter((q) => progressFor(q) >= q.goal).length;

  return (
    <div className="w-full rounded-2xl bg-slate-900/80 border border-slate-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">📋 Daily Quests</h2>
        <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-sm font-semibold">
          {completed}/{QUESTS.length}
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {QUESTS.map((q) => {
          const prog = progressFor(q);
          const done = prog >= q.goal;
          const pct = Math.min(100, Math.round((prog / q.goal) * 100));
          return (
            <div
              key={q.id}
              className={`rounded-xl p-4 border ${done ? "bg-emerald-900/40 border-emerald-500/50" : "bg-slate-800/50 border-slate-700"}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{q.icon}</span>
                <div className="flex-1">
                  <p className={`font-semibold ${done ? "text-emerald-300 line-through" : "text-white"}`}>{q.title}</p>
                  <p className="text-xs text-slate-400">{q.description}</p>
                </div>
                <span className={`text-sm font-mono font-bold ${done ? "text-emerald-400" : "text-slate-300"}`}>
                  {prog}/{q.goal}
                </span>
              </div>
              <div className="mt-3 h-2 w-full rounded-full bg-slate-700 overflow-hidden">
                <div className={`h-full rounded-full ${done ? "bg-emerald-500" : "bg-gradient-to-r from-yellow-500 to-orange-400"}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
