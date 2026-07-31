"use client";
import { useEffect, useState } from 'react';

interface Quest {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
}

const dailyQuests: Quest[] = [
  { id: 'squat', title: 'Squat Challenge', description: 'Perform 10 squats', completed: false },
  { id: 'pushup', title: 'Push‑up Burst', description: 'Do 15 push‑ups', completed: false },
  { id: 'plank', title: 'Plank Hold', description: 'Hold plank 60 s', completed: false },
];

export default function DailyQuests() {
  const [quests, setQuests] = useState<Quest[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const stored = localStorage.getItem('dailyQuests');
      if (stored) {
        setQuests(JSON.parse(stored));
      } else {
        localStorage.setItem('dailyQuests', JSON.stringify(dailyQuests));
        setQuests(dailyQuests);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="w-full max-w-2xl mt-8">
      <h2 className="text-2xl font-bold mb-4">Daily Quest</h2>
      <ul className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {quests.map(q => (
          <li key={q.id} className="p-4 border rounded bg-gray-100 dark:bg-gray-800"
            style={{ opacity: q.completed ? 0.6 : 1 }}
          >
            <div className="flex items-center justify-between">
              <span>{q.title}</span>
              {q.completed ? (
                <span className="text-green-600 font-semibold">✓</span>
              ) : (
                <span className="text-gray-700">⏳</span>
              )}
            </div>
            {q.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400"
                style={{ textDecorationLine: q.completed ? 'line-through' : 'none' }}
              >{q.description}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
