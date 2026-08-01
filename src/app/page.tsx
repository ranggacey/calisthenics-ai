import Link from "next/link";
import { badges } from "@/lib/badges";
import { BadgeCard } from "@/components/ui/BadgeCard";
import HomeChallenge from "@/components/HomeChallenge";

export default function Home() {
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
        <Link href="/dashboard" className="rounded-lg border border-slate-700 bg-slate-800/50 p-6 shadow-lg transition-transform hover:scale-105 hover:bg-slate-800">
          <h3 className="text-2xl font-bold">Dashboard &rarr;</h3>
          <p className="mt-2 text-slate-400">See all your stats, challenge progress &amp; history.</p>
        </Link>
      </section>

      <HomeChallenge />

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
