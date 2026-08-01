"use client";
import { useEffect, useState } from "react";
import PoseDetector from "@/components/PoseDetector";
import ExerciseSelector from "@/components/ExerciseSelector";
import StatsDashboard from "@/components/StatsDashboard";
import Achievements from "@/components/Achievements";
import DailyQuests from "@/components/DailyQuests";
import SessionTimer from "@/components/SessionTimer";
import ChallengeTracker from "@/components/ChallengeTracker";
import WorkoutHistory from "@/components/WorkoutHistory";
import WeeklyActivity from "@/components/WeeklyActivity";
import MotivationalQuote from "@/components/MotivationalQuote";
import SoundToggle from "@/components/SoundToggle";

export default function WorkoutPage() {
  const [exercise, setExercise] = useState("squat");

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <header className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">🏋️ Workout Session</h1>
          <p className="mt-2 text-slate-400">Position yourself in front of the camera — AI will count your reps & check your form</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-6">
            <ExerciseSelector value={exercise} onChange={setExercise} />
            <PoseDetector exerciseId={exercise} />
            <ChallengeTracker />
            <Achievements />
            <DailyQuests />
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            <div className="rounded-2xl bg-slate-900/80 border border-slate-700 p-6">
              <SessionTimer />
            </div>
            <StatsDashboard />
            <WeeklyActivity />
            <WorkoutHistory />
            <MotivationalQuote />
            <div className="flex justify-center">
              <SoundToggle />
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
