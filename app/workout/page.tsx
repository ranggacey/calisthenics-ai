"use client";
import { useEffect, useState } from 'react';
import PoseDetector from '../components/PoseDetector';
import Achievements from '../components/Achievements';
import DailyQuests from '../components/DailyQuest';

export default function WorkoutPage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Workout Session
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Position yourself in front of the camera
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <PoseDetector />
            <Achievements />
            <DailyQuests />
          </div>

          <aside className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
              <h2 className="text-xl font-semibold mb-4">Session Stats</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Reps</span>
                  <span className="font-mono font-bold">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Level</span>
                  <span className="font-mono font-bold">1</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Streak</span>
                  <span className="font-mono font-bold">0 days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Tempo Phase</span>
                  <span className="font-mono font-bold">Ready</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
              <h2 className="text-xl font-semibold mb-4">Exercise Guide</h2>
              <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                <li>• Squats: 3-1-1 tempo</li>
                <li>• Push-ups: 2-1-2 tempo</li>
                <li>• Plank: Hold 60s</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}