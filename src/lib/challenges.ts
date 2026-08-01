export interface Challenge {
  id: string;
  title: string;
  description: string;
  goal: string;
  reward: string;
  endDate: string;
  /** Numeric goal for progress computation (e.g. 250 push-ups) */
  goalCount: number;
  /** Current user progress toward the goal */
  currentCount: number;
  unit: string;
}

export const seasonalChallenge: Challenge = {
  id: 'season1-pushup-mastery',
  title: 'Season 1: Push-Up Mastery',
  description: 'Master the art of the push-up. Complete 250 perfect-form push-ups before the season ends.',
  goal: '250 Push-Ups',
  reward: 'Golden Push-Up Badge',
  endDate: '2026-08-31',
  goalCount: 250,
  currentCount: 138,
  unit: 'push-ups',
};

export function getChallengeProgress(challenge: Challenge): number {
  if (challenge.goalCount <= 0) return 0;
  return Math.min(100, Math.round((challenge.currentCount / challenge.goalCount) * 100));
}
