"use client";
import { useEffect, useState } from "react";
import { loadStats, loadAchievements, saveAchievements, type WorkoutStats } from "@/lib/storage";

// ============================================================
// Achievements — earned from real workout stats
// ============================================================
interface AchievementDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  check: (s: WorkoutStats) => boolean;
}

const ACHIEVEMENTS: AchievementDef[] = [
  { id: "first-workout", name: "First Step", description: "Complete your first workout", icon: "🏃", check: (s) => s.totalWorkouts >= 1 },
  { id: "ten-workouts", name: "Regular", description: "Complete 10 workouts", icon: "💪", check: (s) => s.totalWorkouts >= 10 },
  { id: "50-reps", name: "Getting Strong", description: "50 total reps", icon: "🔥", check: (s) => s.totalReps >= 50 },
  { id: "500-reps", name: "Beast Mode", description: "500 total reps", icon: "🦾", check: (s) => s.totalReps >= 500 },
  { id: "streak-3", name: "Momentum", description: "3-day streak", icon: "📈", check: (s) => s.streak >= 3 },
  { id: "streak-7", name: "Unstoppable", description: "7-day streak", icon: "⚡", check: (s) => s.streak >= 7 },
  { id: "best-50", name: "One Set Wonder", description: "50 reps in one set", icon: "🎯", check: (s) => s.bestSet >= 50 },
  { id: "best-100", name: "Century Club", description: "100 reps in one set", icon: "👑", check: (s) => s.bestSet >= 100 },
];

export default function Achievements() {
  const [earned, setEarned] = useState<string[]>([]);

  useEffect(() => {

    // Baca stats langsung dari storage setiap event — tidak depend pada state stats
    // (dulu dep [stats] → listener di-register ulang tiap statistik berubah = leak)
    const updateAchievements = () => {
      const s = loadStats();
      const ids = ACHIEVEMENTS.filter((a) => a.check(s)).map((a) => a.id);
      setEarned((prevEarned) => {
        if (JSON.stringify(prevEarned.sort()) !== JSON.stringify(ids.sort())) {
          return ids;
        }
        return prevEarned;
      });
      const prev = loadAchievements();
      if (JSON.stringify(prev) !== JSON.stringify(ids)) saveAchievements(ids);
    };

    updateAchievements(); // Panggil saat mount
    window.addEventListener("storage", updateAchievements); // Panggil saat storage berubah
    return () => {
      window.removeEventListener("storage", updateAchievements);
    };
  }, []);

  const earnedCount = earned.length;

  return (
    <div className="w-full rounded-2xl bg-slate-900/80 border border-slate-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">🏆 Achievements</h2>
        <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-sm font-semibold">
          {earnedCount}/{ACHIEVEMENTS.length}
        </span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {ACHIEVEMENTS.map((a) => {
          const isEarned = earned.includes(a.id);
          return (
            <div
              key={a.id}
              className={`rounded-xl p-3 text-center border ${
                isEarned
                  ? "bg-emerald-900/40 border-emerald-500/50"
                  : "bg-slate-800/50 border-slate-700"
              }`}
            >
              <div className={`text-2xl mb-1 ${isEarned ? "" : "opacity-30 grayscale"}`}>{a.icon}</div>
              <p className={`text-sm font-semibold ${isEarned ? "text-emerald-300" : "text-slate-400"}`}>
                {a.name}
              </p>
              <p className="text-xs text-slate-500 mt-1">{a.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
