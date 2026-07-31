export interface Challenge {
  id: string;
  title: string;
  description: string;
  goal: string;
  reward: string;
  endDate: string;
}

export const seasonalChallenge: Challenge = {
  id: 'season1-pushup-mastery',
  title: 'Season 1: Push-Up Mastery',
  description: 'Master the art of the push-up. Complete 250 perfect-form push-ups before the season ends.',
  goal: '250 Push-Ups',
  reward: 'Golden Push-Up Badge',
  endDate: '2026-08-31',
};
