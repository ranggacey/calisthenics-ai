"use client";
import { useState } from "react";
import { Dumbbell, Timer, Flame, Save } from "lucide-react";
import Link from "next/link";

// ============================================================
// Create Workout — user bikin custom routine, simpan ke localStorage
// ============================================================
interface ExerciseItem {
  id: string;
  name: string;
  sets: number;
  reps: number;
}

interface Routine {
  id: string;
  name: string;
  emoji: string;
  createdAt: string;
  exercises: ExerciseItem[];
}

const EMOJIS = ["🔥", "💪", "🏋️", "⚡", "🎯", "🦵", "🏃"];

const SUGGESTIONS = [
  { id: "pushup", name: "Push-Up" },
  { id: "squat", name: "Squat" },
  { id: "plank", name: "Plank" },
  { id: "pullup", name: "Pull-Up" },
  { id: "dips", name: "Dips" },
  { id: "lunges", name: "Lunges" },
  { id: "burpee", name: "Burpee" },
  { id: "crunch", name: "Crunch" },
];

export default function CreateWorkoutPage() {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🔥");
  const [exercises, setExercises] = useState<ExerciseItem[]>([]);
  const [saved, setSaved] = useState<Routine | null>(null);
  const [routines, setRoutines] = useState<Routine[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem("cali_routines") ?? "[]");
    } catch {
      return [];
    }
  });

  const addExercise = (ex: { id: string; name: string }) => {
    setExercises((prev) => [...prev, { ...ex, sets: 3, reps: 10 }]);
  };

  const updateExercise = (idx: number, patch: Partial<ExerciseItem>) => {
    setExercises((prev) => prev.map((e, i) => (i === idx ? { ...e, ...patch } : e)));
  };

  const removeExercise = (idx: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== idx));
  };

  const saveRoutine = () => {
    if (!name.trim() || exercises.length === 0) return;
    const routine: Routine = {
      id: `r-${Date.now()}`,
      name: name.trim(),
      emoji,
      createdAt: new Date().toISOString(),
      exercises,
    };
    const next = [...routines, routine];
    setRoutines(next);
    try {
      localStorage.setItem("cali_routines", JSON.stringify(next));
    } catch {
      /* ignore */
    }
    setSaved(routine);
    setName("");
    setExercises([]);
  };

  const deleteRoutine = (id: string) => {
    const next = routines.filter((r) => r.id !== id);
    setRoutines(next);
    try {
      localStorage.setItem("cali_routines", JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      <h1 className="text-4xl font-bold mb-2">Create Custom Workout</h1>
      <p className="text-slate-400 mb-8">
        Build your own routine and save it to your device. No account needed.
      </p>

      <div className="bg-slate-900 rounded-2xl border border-slate-700 p-6 mb-8">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <span className="text-slate-400 text-sm font-semibold">Emoji:</span>
          {EMOJIS.map((e) => (
            <button
              key={e}
              onClick={() => setEmoji(e)}
              className={`h-10 w-10 rounded-lg text-xl flex items-center justify-center border ${
                emoji === e ? "bg-slate-700 border-emerald-500/60" : "bg-slate-800 border-slate-700"
              }`}
            >
              {e}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Routine name — e.g. Full Body Blast"
          className="w-full p-3 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 mb-4"
        />

        <div className="mb-4">
          <p className="text-slate-400 text-sm font-semibold mb-2">Add exercises:</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((ex) => (
              <button
                key={ex.id}
                onClick={() => addExercise(ex)}
                className="px-3 py-1.5 rounded-full bg-slate-800 border border-slate-600 text-slate-200 text-sm hover:bg-slate-700"
              >
                + {ex.name}
              </button>
            ))}
          </div>
        </div>

        {exercises.length > 0 && (
          <div className="space-y-2 mb-4">
            {exercises.map((ex, i) => (
              <div key={i} className="flex items-center gap-3 bg-slate-800 rounded-lg p-3">
                <span className="font-semibold text-white flex-1">{ex.name}</span>
                <label className="text-xs text-slate-400">
                  Sets
                  <input
                    type="number"
                    min={1}
                    value={ex.sets}
                    onChange={(e) => updateExercise(i, { sets: Number(e.target.value) })}
                    className="w-14 ml-1 p-1 rounded bg-slate-700 text-white text-center"
                  />
                </label>
                <label className="text-xs text-slate-400">
                  Reps
                  <input
                    type="number"
                    min={1}
                    value={ex.reps}
                    onChange={(e) => updateExercise(i, { reps: Number(e.target.value) })}
                    className="w-14 ml-1 p-1 rounded bg-slate-700 text-white text-center"
                  />
                </label>
                <button
                  onClick={() => removeExercise(i)}
                  className="text-red-400 hover:text-red-300 px-2"
                  aria-label="Remove"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={saveRoutine}
          disabled={!name.trim() || exercises.length === 0}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Save className="h-4 w-4" /> Save Routine
        </button>
      </div>

      {saved && (
        <div className="mb-8 rounded-xl bg-emerald-900/40 border border-emerald-500/50 p-4 text-emerald-300">
          ✅ Routine &ldquo;{saved.name}&rdquo; saved! Do it now on the workout page.
        </div>
      )}

      {routines.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">My Routines</h2>
          <div className="space-y-3">
            {routines.map((r) => (
              <div key={r.id} className="bg-slate-900 rounded-xl border border-slate-700 p-4 flex items-center justify-between">
                <div>
                  <p className="font-bold text-white">
                    {r.emoji} {r.name}
                  </p>
                  <p className="text-sm text-slate-400">
                    {r.exercises.map((e) => `${e.name} ${e.sets}x${e.reps}`).join(" · ")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href="/workout"
                    className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold"
                  >
                    Do It
                  </Link>
                  <button
                    onClick={() => deleteRoutine(r.id)}
                    className="px-2 py-1.5 rounded-lg text-red-400 hover:bg-slate-800 text-sm"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-10 flex justify-center gap-4 text-sm text-slate-500">
        <span className="inline-flex items-center gap-1"><Dumbbell className="h-4 w-4" /> Custom</span>
        <span className="inline-flex items-center gap-1"><Timer className="h-4 w-4" /> Timed</span>
        <span className="inline-flex items-center gap-1"><Flame className="h-4 w-4" /> Burn</span>
      </div>
    </div>
  );
}
