"use client";
import { useEffect, useState } from "react";
import { loadChallenge } from "@/lib/storage";
import { seasonalChallenge, getChallengeProgress } from "@/lib/challenges";

// ============================================================
// Home Challenge Card — progress dari localStorage (bukan hardcoded)
// ============================================================
export default function HomeChallenge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const load = () => setCount(loadChallenge().count);
    load();
    const onStorage = () => load();
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const progress = getChallengeProgress(seasonalChallenge, count);

  return (
    <div className="w-full max-w-5xl rounded-xl border-2 border-yellow-400/80 bg-gradient-to-br from-gray-800 to-gray-900 p-8 shadow-2xl mb-12">
      <div className="text-center mb-6">
        <span className="text-sm font-bold uppercase tracking-widest text-yellow-400">Limited Time Event</span>
        <h2 className="mt-2 text-4xl font-extrabold">{seasonalChallenge.title}</h2>
      </div>
      <p className="mt-4 text-center text-lg text-slate-300">{seasonalChallenge.description}</p>
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between text-lg bg-slate-900/50 rounded-lg p-4">
        <div className="text-center sm:text-left">
          <p className="font-semibold">Goal:</p>
          <p className="text-yellow-400 font-bold">{seasonalChallenge.goal}</p>
        </div>
        <div className="mt-4 sm:mt-0 text-center sm:text-right">
          <p className="font-semibold">Reward:</p>
          <p className="text-yellow-400 font-bold">{seasonalChallenge.reward}</p>
        </div>
      </div>
      <div className="mt-6">
        <div className="flex justify-between text-sm text-slate-400 mb-2">
          <span>Progress: {count} / {seasonalChallenge.goalCount} {seasonalChallenge.unit}</span>
          <span className="font-bold text-yellow-400">{progress}%</span>
        </div>
        <div className="h-4 w-full overflow-hidden rounded-full bg-slate-700">
          <div className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-amber-400 transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>
      <p className="mt-6 text-center text-sm text-slate-500">Season ends: {new Date(seasonalChallenge.endDate).toLocaleDateString()}</p>
    </div>
  );
}
