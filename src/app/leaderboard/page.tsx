'use client';
import { useState } from 'react';
import { leaderboard } from '@/lib/leaderboardData';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const ENTRIES_PER_PAGE = 10;

const LeaderboardPage = () => {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(0, Math.ceil(leaderboard.length / ENTRIES_PER_PAGE) - 1);
  const displayed = leaderboard.slice(page * ENTRIES_PER_PAGE, (page + 1) * ENTRIES_PER_PAGE);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold mb-6">Leaderboard</h1>
      <ul className="space-y-4">
        {displayed.map((entry) => (
          <li key={entry.id} className="flex justify-between bg-card p-4 rounded-lg shadow-sm">
            <span className="font-medium">{entry.name}</span>
            <span className="text-primary">{entry.score}</span>
          </li>
        ))}
      </ul>
      <div className="flex justify-between mt-4">
        <button
          onClick={() => setPage((p) => Math.max(p - 1, 0))}
          disabled={page === 0}
          className="px-4 py-2 bg-slate-700 text-white rounded disabled:opacity-50"
        >
          Previous
        </button>
        <span className="self-center">Page {page + 1} of {totalPages + 1}</span>
        <button
          onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
          disabled={page >= totalPages}
          className="px-4 py-2 bg-slate-700 text-white rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
      <Link href="/dashboard">
        <button className="mt-4 inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
          <ArrowRight className="mr-2 h-4 w-4" />
          Back to Dashboard
        </button>
      </Link>
    </div>
  );
};

export default LeaderboardPage;
