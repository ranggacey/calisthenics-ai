import Link from "next/link";
import { seasonalChallenge, getChallengeProgress } from "@/lib/challenges";
import { badges } from "@/lib/badges";
import { BadgeCard } from "@/components/ui/BadgeCard";

export default function Home() {
  const progress = getChallengeProgress(seasonalChallenge);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white p-8">
      <header className="text-center mb-12">
        <h1 className="text-5xl font-black tracking-tighter sm:text-6xl md:text-7xl">
          Calisthenics AI Trainer
        </h1>
        <p className="mt-4 text-lg text-slate-400 md:text-xl">
          Your personal AI-powered calisthenics coach.
        </p>
      </header>

      <section className="grid w-full max-w-5xl grid-cols-1 gap-6 md:grid-cols-3 mb-12">
        <Link href="/workout" className="rounded-lg border border-slate-700 bg-slate-800/50 p-6 shadow-lg transition-transform hover:scale-105 hover:bg-slate-800">
          <h3 className="text-2xl font-bold">Start Workout &rarr;</h3>
          <p className="mt-2 text-slate-400">Begin a new workout session with real-time feedback.</p>
        </Link>
        <Link href="/leaderboard" className="rounded-lg border border-slate-700 bg-slate-800/50 p-6 shadow-lg transition-transform hover:scale-105 hover:bg-slate-800">
          <h3 className="text-2xl font-bold">Leaderboard &rarr;</h3>
          <p className="mt-2 text-slate-400">See how you rank against other users.</p>
        </Link>
        <Link href="/create-workout" className="rounded-lg border border-slate-700 bg-slate-800/50 p-6 shadow-lg transition-transform hover:scale-105 hover:bg-slate-800">
          <h3 className="text-2xl font-bold">Create Workout &rarr;</h3>
          <p className="mt-2 text-slate-400">Design and save your own custom workout routines.</p>
        </Link>
      </section>

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
            <span>Progress: {seasonalChallenge.currentCount} / {seasonalChallenge.goalCount} {seasonalChallenge.unit}</span>
            <span className="font-bold text-yellow-400">{progress}%</span>
          </div>
          <div className="h-4 w-full overflow-hidden rounded-full bg-slate-700">
            <div className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-amber-400 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <p className="mt-6 text-center text-sm text-slate-500">Season ends: {new Date(seasonalChallenge.endDate).toLocaleDateString()}</p>
      </div>

      <section className="w-full max-w-5xl mb-12">
        <h2 className="text-2xl font-bold mb-4 text-white">Earn Badges</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {badges.map((b) => (
            <BadgeCard key={b.id} badge={b} />
          ))}
        </div>
      </section>

      <footer className="mt-12 text-center text-slate-500">
        <p>Built with Next.js, MediaPipe & Web Audio API</p>
      </footer>
    </main>
  );
}
