export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
}

export const leaderboard: LeaderboardEntry[] = [
  { id: '1', name: 'Alice', score: 1500 },
  { id: '2', name: 'Bob', score: 1200 },
  { id: '3', name: 'Charlie', score: 900 },
];
