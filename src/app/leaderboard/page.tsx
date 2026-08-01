'use client';
import { useState } from 'react';
import { leaderboard, type LeaderboardEntry } from '@/lib/leaderboardData';
import Link from 'next/link';
import { ArrowRight, Medal, Trophy } from 'lucide-react';

const ENTRIES_PER_PAGE = 10;

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return <Trophy className="h-6 w-6 text-yellow-400" aria-label="Rank 1" />;
  }
  if (rank === 2) {
    return <Medal className="h-6 w-6 text-slate-300" aria-label="Rank 2" />;
  }
  if (rank === 3) {
    return <Medal className="h-6 w-6 text-amber-600" aria-label="Rank 3" />;
  }
  return <span className="w-6 text-center font-mono text-slate-400">{rank}</span>;
}

function LeaderboardRow({ entry, rank }: { entry: LeaderboardEntry; rank: number }) {
  const isTopThree = rank <= 3;
  return (
    <li
      className={`flex items-center justify-between gap-4 p-4 rounded-lg shadow-sm ${
        isTopThree ? 'bg-yellow-400/10 border border-yellow-400/30' : 'bg-card'
      }`}
    >
      <div className="flex items-center gap-4 min-w-0">
        <RankBadge rank={rank} />
        <div className="min-w-0">
          <p className="font-medium truncate">{entry.name}</p>
          <p className="text-xs text-muted-foreground">
            {entry.workouts ?? 0} workouts · {entry.streak ?? 0}-day streak
          </p>
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="font-bold text-primary">{entry.score.toLocaleString()}</p>
        <p className="text-xs text-muted-foreground">pts</p>
      </div>
    </li>
  );
}

const LeaderboardPage = () => {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const filtered = leaderboard.filter(entry => entry.name.toLowerCase().includes(search.toLowerCase()));
  const totalPages = Math.max(0, Math.ceil(filtered.length / ENTRIES_PER_PAGE) - 1);
  const displayed = filtered.slice(page * ENTRIES_PER_PAGE, (page + 1) * ENTRIES_PER_PAGE);
  const startRank = page * ENTRIES_PER_PAGE + 1;

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-4xl font-bold mb-2">Leaderboard</h1>
      <input type="text" placeholder="Search athletes..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} className="mb-4 p-2 border rounded w-full max-w-sm" />
      <ul className="space-y-3">
        {displayed.map((entry, i) => (
          <LeaderboardRow key={entry.id} entry={entry} rank={startRank + i} />
        ))}
      </ul>
      {leaderboard.length === 0 && (
        <p className="text-center text-muted-foreground py-8">No athletes yet — be the first!</p>
      )}
      <div className="flex justify-between mt-6">
        <button
          onClick={() => setPage((p) => Math.max(p - 1, 0))}
          disabled={page === 0}
          className="px-4 py-2 bg-slate-700 text-white rounded disabled:opacity-50"
        >
          Previous
        </button>
        <span className="self-center">
          Page {page + 1} of {totalPages + 1}
        </span>
        <button
          onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
          disabled={page >= totalPages}
          className="px-4 py-2 bg-slate-700 text-white rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
      <Link href="/dashboard" className="inline-block mt-6">
        <button className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
          <ArrowRight className="mr-2 h-4 w-4" />
          Back to Dashboard
        </button>
      </Link>
    </div>
  );
};

export default LeaderboardPage;
