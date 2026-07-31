"use client";
import { useEffect, useState } from 'react';

interface Achievement {
  id: string;
  name: string;
  description?: string;
  achieved: boolean;
}

const defaultAchievements: Achievement[] = [
  { id: 'first', name: 'First Workout', description: 'Complete your first session', achieved: false },
  { id: 'streak5', name: '5‑Day Streak', description: 'Work out 5 days in a row', achieved: false },
  { id: 'level10', name: 'Level 10', description: 'Reach level 10', achieved: false },
];

export default function Achievements() {
  const [list, setList] = useState<Achievement[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const stored = localStorage.getItem('achievements');
      if (stored) {
        setList(JSON.parse(stored));
      } else {
        localStorage.setItem('achievements', JSON.stringify(defaultAchievements));
        setList(defaultAchievements);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="w-full max-w-2xl mt-8">
      <h2 className="text-2xl font-bold mb-4">Achievements</h2>
      <ul className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {list.map(a => (
          <li key={a.id} className="p-4 border rounded bg-gray-100 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <span>{a.name}</span>
              {a.achieved ? (
                <span className="text-green-600 font-semibold">✓</span>
              ) : (
                <span className="text-gray-400">✗</span>
              )}
            </div>
            {a.description && <p className="text-sm text-gray-600 dark:text-gray-400">{a.description}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
