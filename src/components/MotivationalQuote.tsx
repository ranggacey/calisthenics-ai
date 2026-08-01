"use client";
import { useState } from "react";

// ============================================================
// Motivational Quotes — rotating fitness quotes
// ============================================================
const QUOTES = [
  "The only bad workout is the one that didn't happen.",
  "Strength doesn't come from what you can do. It comes from overcoming the things you once thought you couldn't.",
  "Push yourself because no one else is going to do it for you.",
  "Your body can stand almost anything. It's your mind you have to convince.",
  "Discipline is choosing between what you want now and what you want most.",
  "Sweat is fat crying.",
  "The pain you feel today will be the strength you feel tomorrow.",
  "Don't stop when you're tired. Stop when you're done.",
];

export default function MotivationalQuote() {
  const [idx] = useState(() => Math.floor(Math.random() * QUOTES.length));

  return (
    <div className="w-full rounded-2xl bg-slate-900/60 border border-slate-700/60 p-6 text-center">
      <p className="text-lg italic text-slate-300">&ldquo;{QUOTES[idx]}&rdquo;</p>
    </div>
  );
}
