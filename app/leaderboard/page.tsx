
import React from 'react';

const dummyData = [
  { rank: 1, name: 'Rangga', score: 15000, streak: 120 },
  { rank: 2, name: 'Yuna', score: 14500, streak: 115 },
  { rank: 3, name: 'Bot', score: 12000, streak: 90 },
  { rank: 4, name: 'User', score: 10500, streak: 75 },
  { rank: 5, name: 'Guest', score: 9000, streak: 60 },
];

const LeaderboardPage = () => {
  return (
    <div className="container mx-auto p-4 text-white">
      <h1 className="text-4xl font-bold mb-8 text-center">Leaderboard</h1>
      <div className="bg-gray-800 bg-opacity-50 rounded-lg shadow-lg p-6">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-600">
              <th className="p-4">Rank</th>
              <th className="p-4">Name</th>
              <th className="p-4">Score</th>
              <th className="p-4">Streak</th>
            </tr>
          </thead>
          <tbody>
            {dummyData.map((user) => (
              <tr key={user.rank} className="border-b border-gray-700 hover:bg-gray-700 transition-colors">
                <td className="p-4">{user.rank}</td>
                <td className="p-4">{user.name}</td>
                <td className="p-4">{user.score}</td>
                <td className="p-4">{user.streak}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeaderboardPage;
