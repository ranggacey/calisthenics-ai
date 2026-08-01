export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  /** Total workouts completed (optional metadata for richer display) */
  workouts?: number;
  /** Current streak in days (optional metadata) */
  streak?: number;
}

export const leaderboard: LeaderboardEntry[] = [
  { id: '1', name: 'Alice', score: 1500, workouts: 120, streak: 45 },
  { id: '2', name: 'Bob', score: 1200, workouts: 98, streak: 31 },
  { id: '3', name: 'Charlie', score: 900, workouts: 76, streak: 22 },
  { id: '4', name: 'Diana', score: 850, workouts: 70, streak: 18 },
  { id: '5', name: 'Ethan', score: 780, workouts: 64, streak: 15 },
  { id: '6', name: 'Fiona', score: 720, workouts: 60, streak: 12 },
  { id: '7', name: 'George', score: 690, workouts: 55, streak: 10 },
  { id: '8', name: 'Hannah', score: 640, workouts: 52, streak: 9 },
  { id: '9', name: 'Ian', score: 600, workouts: 48, streak: 8 },
  { id: '10', name: 'Julia', score: 560, workouts: 45, streak: 7 },
  { id: '11', name: 'Kevin', score: 530, workouts: 41, streak: 6 },
  { id: '12', name: 'Luna', score: 490, workouts: 38, streak: 5 },
  { id: '13', name: 'Mike', score: 450, workouts: 35, streak: 4 },
  { id: '14', name: 'Nina', score: 410, workouts: 32, streak: 3 },
  { id: '15', name: 'Oscar', score: 380, workouts: 28, streak: 3 },
  { id: '16', name: 'Paula', score: 340, workouts: 25, streak: 2 },
  { id: '17', name: 'Quinn', score: 300, workouts: 22, streak: 2 },
  { id: '18', name: 'Ryan', score: 260, workouts: 18, streak: 1 },
  { id: '19', name: 'Sofia', score: 220, workouts: 15, streak: 1 },
  { id: '20', name: 'Tom', score: 180, workouts: 12, streak: 1 },
  { id: '21', name: 'Uma', score: 140, workouts: 9, streak: 0 },
  { id: '22', name: 'Victor', score: 100, workouts: 6, streak: 0 },
  { id: '23', name: 'Wendy', score: 60, workouts: 3, streak: 0 },
  { id: '24', name: 'Xavier', score: 30, workouts: 1, streak: 0 },
];
