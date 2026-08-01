"use client";
import { useEffect, useRef, useState } from "react";
import PoseDetector from "../components/PoseDetector";
import Achievements from "../components/Achievements";
import DailyQuests from "../components/DailyQuest";
import { EXERCISES, getExercise } from "@/lib/exercises";
import type { ExerciseId } from "@/lib/exercises";

interface RepFrame {
  reps: number;
  formGood: boolean;
  angle: number | null;
  repCompleted: boolean;
}

export default function WorkoutPage() {
  const [exercise, setExercise] = useState<ExerciseId>("squat");
  const [reps, setReps] = useState(0);
  const [formGood, setFormGood] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [started, setStarted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const def = getExercise(exercise);
  const target = def.target;

  // Session timer — runs once camera/pose session starts (first rep frame).
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    // Reset counter + timer when switching exercise
    setReps(0);
    setElapsed(0);
    setStarted(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [exercise]);

  const handleRep = (frame: RepFrame) => {
    setFormGood(frame.formGood);
    if (!started) {
      setStarted(true);
      timerRef.current = setInterval(() => {
        setElapsed((e) => e + 1);
      }, 1000);
    }
    if (frame.repCompleted) {
      setReps(frame.reps);
    } else if (def.unit === "seconds") {
      // Plank: continuous hold counter (elapsed seconds)
      setReps(frame.formGood ? Math.min(elapsed + 1, target) : Math.max(elapsed - 1, 0));
    }
  };

  const progress = def.unit === "reps" ? Math.min((reps / target) * 100, 100) : Math.min((elapsed / target) * 100, 100);
  const remaining = def.unit === "reps" ? Math.max(target - reps, 0) : Math.max(target - elapsed, 0);
  const isComplete = def.unit === "reps" ? reps >= target : elapsed >= target;

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Workout Session
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Position yourself in front of the camera
          </p>
        </header>

        {/* Exercise selector */}
        <div className="flex flex-wrap justify-center gap-3 mb-6">
          {EXERCISES.map((e) => (
            <button
              key={e.id}
              onClick={() => setExercise(e.id)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${
                exercise === e.id
                  ? "bg-blue-600 text-white"
                  : "bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-blue-400"
              }`}
            >
              {e.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <PoseDetector exercise={exercise} onRep={handleRep} />
            {!formGood && def.unit === "reps" && (
              <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200 rounded-lg p-3 text-sm font-medium">
                ⚠️ Form check: keep a steady rhythm — bend fully, then extend
                completely to count a rep.
              </div>
            )}
            <Achievements />
            <DailyQuests />
          </div>

          <aside className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
              <h2 className="text-xl font-semibold mb-4">Session Stats</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Exercise</span>
                  <span className="font-mono font-bold">{def.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    {def.unit === "reps" ? "Reps" : "Hold"}
                  </span>
                  <span className="font-mono font-bold">
                    {def.unit === "reps" ? reps : formatTime(elapsed)}
                    {def.unit === "reps" && <span className="text-gray-400"> / {target}</span>}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Time</span>
                  <span className="font-mono font-bold">{formatTime(elapsed)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Tempo</span>
                  <span className="font-mono font-bold">{def.tempo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Status</span>
                  <span className={`font-mono font-bold ${isComplete ? "text-green-600 dark:text-green-400" : started ? "text-blue-600 dark:text-blue-400" : "text-gray-400"}`}>
                    {isComplete ? "✓ Complete" : started ? "In progress" : "Ready"}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-5">
                <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-1">
                  <span>Target {target} {def.unit === "reps" ? "reps" : "sec"}</span>
                  <span className="font-bold">{Math.round(progress)}%</span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isComplete
                        ? "bg-green-500"
                        : "bg-gradient-to-r from-blue-500 to-cyan-400"
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {isComplete && (
                <div className="mt-4 rounded-lg bg-green-50 dark:bg-green-900/30 border border-green-300 dark:border-green-700 p-3 text-center">
                  <p className="text-green-700 dark:text-green-300 font-bold text-lg">🎉 {def.name} complete!</p>
                  <p className="text-sm text-green-600 dark:text-green-400">{remaining} remaining — great job!</p>
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
              <h2 className="text-xl font-semibold mb-4">Exercise Guide</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{def.description}</p>
              <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                {EXERCISES.map((e) => (
                  <li key={e.id}>
                    <span className="font-semibold">{e.name}:</span>{" "}
                    {e.tempo} tempo, target {e.target} {e.unit}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
