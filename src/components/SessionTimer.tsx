"use client";
import { useEffect, useState } from "react";

// ============================================================
// Session Timer — elapsed time for the current workout
// ============================================================
export default function SessionTimer() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const iv = setInterval(() => {
      setSeconds(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div className="text-center">
      <p className="text-xs uppercase tracking-wide text-slate-400">Session Time</p>
      <p className="text-3xl font-mono font-bold text-white">{mm}:{ss}</p>
    </div>
  );
}
