import Link from 'next/link';
import { seasonalChallenge } from '@/lib/challenges';

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
      
      <section className="grid w-full max-w-4xl grid-cols-1 gap-6 md:grid-cols-2 mb-12">
        <Link href="/workout" className="rounded-lg border border-slate-700 bg-slate-800/50 p-6 shadow-lg transition-transform hover:scale-105 hover:bg-slate-800">
          <h3 className="text-2xl font-bold">Start Workout &rarr;</h3>
          <p className="mt-2 text-slate-400">
            Begin a new workout session with real-time feedback.
          </p>
        </Link>
        <Link href="/leaderboard" className="rounded-lg border border-slate-700 bg-slate-800/50 p-6 shadow-lg transition-transform hover:scale-105 hover:bg-slate-800">
          <h3 className="text-2xl font-bold">Leaderboard &rarr;</h3>
          <p className="mt-2 text-slate-400">
            See how you rank against other users.
          </p>
        </Link>
      </section>

      <div className="w-full max-w-4xl rounded-xl border-2 border-yellow-400/80 bg-gradient-to-br from-gray-800 to-gray-900 p-8 shadow-2xl">
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
        <p className="mt-6 text-center text-sm text-slate-500">Season ends: {new Date(seasonalChallenge.endDate).toLocaleDateString()}</p>
      </div>

      <footer className="mt-12 text-center text-slate-500">
        <p>Built with Next.js, MediaPipe & Web Audio API</p>
      </footer>
    </main>
  );
}
