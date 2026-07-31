export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string
}

export const badges: Badge[] = [
  { id: 'pushup-master', name: 'Push-Up Master', description: 'Complete 250 perfect push-ups', icon: 'Dumbbell' },
  { id: 'streak-7', name: '7-Day Streak', description: 'Work out 7 days in a row', icon: 'Fire' },
  { id: 'hero-badge', name: 'Hero Badge', description: 'Earn 1000 points', icon: 'Star' },
];
