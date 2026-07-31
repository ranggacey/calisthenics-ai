import { LeaderboardEntry, leaderboard } from '@/lib/leaderboardData';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const LeaderboardPage = () => {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold mb-6">Leaderboard</h1>
      <ul className="space-y-4">
        {leaderboard.map((entry) => (
          <li key={entry.id} className="flex justify-between bg-card p-4 rounded-lg shadow-sm">
            <span className="font-medium">{entry.name}</span>
            <span className="text-primary">{entry.score}</span>
          </li>
        ))}
      </ul>
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
