"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  loadStats,
  loadHistory,
  loadChallenge,
  loadDailyLog,
  type WorkoutStats,
  type SessionRecord,
} from "@/lib/storage";
import { seasonalChallenge } from "@/lib/challenges";

// ============================================================
// Dashboard — ringkasan semua progress user dari localStorage
// ============================================================
export default function DashboardPage() {
  const [stats, setStats] = useState<WorkoutStats>(loadStats);
  const [history, setHistory] = useState<SessionRecord[]>([]);
  const [challenge, setChallenge] = useState(loadChallenge);
  const [daily, setDaily] = useState(loadDailyLog);

  useEffect(() => {
    const refresh = () => {
      setStats(loadStats());
      setHistory(loadHistory());
      setChallenge(loadChallenge());
      setDaily(loadDailyLog());
    };
    refresh();
    window.addEventListener("storage", refresh);
    return () => window.removeEventListener("storage", refresh);
  }, []);

  const challengePct = Math.min(
    100,
    Math.round((challenge.count / seasonalChallenge.goalCount) * 100)
  );

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
      <p className="text-slate-400 mb-8">
        Your training overview — all saved locally on this device.
      </p>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="rounded-xl bg-slate-900 border border-slate-700 p-5">
          <p className="text-xs uppercase tracking-wide text-slate-400">Total Reps</p>
          <p className="mt-1 text-3xl font-bold text-white">{stats.totalReps.toLocaleString()}</p>
        </div>
        <div className="rounded-xl bg-slate-900 border border-slate-700 p-5">
          <p className="text-xs uppercase tracking-wide text-slate-400">Workouts</p>
          <p className="mt-1 text-3xl font-bold text-white">{stats.totalWorkouts}</p>
        </div>
        <div className="rounded-xl bg-slate-900 border border-slate-700 p-5">
          <p className="text-xs uppercase tracking-wide text-slate-400">Streak</p>
          <p className="mt-1 text-3xl font-bold text-white">{stats.streak}d</p>
        </div>
        <div className="rounded-xl bg-slate-900 border border-slate-700 p-5">
          <p className="text-xs uppercase tracking-wide text-slate-400">Best Set</p>
          <p className="mt-1 text-3xl font-bold text-white">{stats.bestSet}</p>
        </div>
      </div>

      {/* Challenge */}
      <div className="rounded-2xl bg-gradient-to-br from-amber-900/40 to-slate-900 border border-amber-500/40 p-6 mb-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-amber-300">🔥 {seasonalChallenge.title}</h2>
        </div>
        <div className="flex justify-between text-sm text-slate-300 mb-2">
          <span className="font-mono">
            {challenge.count} / {seasonalChallenge.goalCount} {seasonalChallenge.unit}
          </span>
          <span className="font-bold text-amber-300">{challengePct}%</span>
        </div>
        <div className="h-3 w-full rounded-full bg-slate-700 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-300 transition-all duration-500"
            style={{ width: `${challengePct}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Reward: {seasonalChallenge.reward} · Ends {new Date(seasonalChallenge.endDate).toLocaleDateString()}
        </p>
      </div>

      {/* Daily summary */}
      <div className="rounded-2xl bg-slate-900 border border-slate-700 p-6 mb-8">
        <h2 className="text-xl font-bold text-white mb-3">📋 Today</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
          <div className="rounded-lg bg-slate-800 p-3">
            <p className="text-2xl font-bold text-white">{daily.workouts}</p>
            <p className="text-xs text-slate-400">Workouts</p>
          </div>
          <div className="rounded-lg bg-slate-800 p-3">
            <p className="text-2xl font-bold text-white">{daily.byExercise["squat"] ?? 0}</p>
            <p className="text-xs text-slate-400">Squats</p>
          </div>
          <div className="rounded-lg bg-slate-800 p-3">
            <p className="text-2xl font-bold text-white">{daily.byExercise["pushup"] ?? 0}</p>
            <p className="text-xs text-slate-400">Push-ups</p>
          </div>
          <div className="rounded-lg bg-slate-800 p-3">
            <p className="text-2xl font-bold text-white">{daily.byExercise["plank"] ?? 0}</p>
            <p className="text-xs text-slate-400">Plank sec</p>
          </div>
          <div className="rounded-lg bg-slate-800 p-3">
            <p className="text-2xl font-bold text-white">{daily.byExercise["pullup"] ?? 0}</p>
            <p className="text-xs text-slate-400">Pull-ups</p>
          </div>
          <div className="rounded-lg bg-slate-800 p-3">
            <p className="text-2xl font-bold text-white">{daily.byExercise["dips"] ?? 0}</p>
            <p className="text-xs text-slate-400">Dips</p>
          </div>
          <div className="rounded-lg bg-slate-800 p-3">
            <p className="text-2xl font-bold text-white">{daily.byExercise["lunges"] ?? 0}</p>
            <p className="text-xs text-slate-400">Lunges</p>
          </div>
          <div className="rounded-lg bg-slate-800 p-3">
            <p className="text-2xl font-bold text-white">{daily.byExercise["crunch"] ?? 0}</p>
            <p className="text-xs text-slate-400">Crunches</p>
          </div>
          <div className="rounded-lg bg-slate-800 p-3">
            <p className="text-2xl font-bold text-white">{daily.byExercise["burpee"] ?? 0}</p>
            <p className="text-xs text-slate-400">Burpees</p>
          </div>
        </div>
      </div>

      {/* History */}
      <div className="rounded-2xl bg-slate-900 border border-slate-700 p-6 mb-8">
        <h2 className="text-xl font-bold text-white mb-3">🕘 Recent Sessions</h2>
        {history.length === 0 ? (
          <p className="text-slate-500 text-sm">No sessions yet — start your first workout!</p>
        ) : (
          <ul className="space-y-2">
            {[...history]
              .slice(-5)
              .reverse()
              .map((r, i) => (
                <li key={i} className="flex items-center justify-between rounded-lg bg-slate-800 px-4 py-2 text-sm">
                  <span className="font-medium capitalize text-white">{r.exercise}</span>
                  <span className="text-slate-400">{r.reps} reps · {Math.floor(r.duration / 60)}m {r.duration % 60}s</span>
                  <span className="text-slate-500">{new Date(r.date).toLocaleDateString()}</span>
                </li>
              ))}
          </ul>
        )}
      </div>

      <div className="flex gap-3">
        <Link
          href="/workout"
          className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
        >
          Start Workout
        </Link>
        <Link
          href="/create-workout"
          className="px-5 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-semibold"
        >
          Create Routine
        </Link>
      </div>
    </div>
  );
}
