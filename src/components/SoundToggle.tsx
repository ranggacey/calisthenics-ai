"use client";
import { useState } from "react";

// ============================================================
// Sound Toggle — enable/disable audio feedback
// ============================================================
export default function SoundToggle() {
  const [enabled, setEnabled] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("cali_sound") !== "off";
  });

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    localStorage.setItem("cali_sound", next ? "on" : "off");
  };

  return (
    <button
      onClick={toggle}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold border border-slate-700"
    >
      <span>{enabled ? "🔊" : "🔇"}</span>
      {enabled ? "Sound On" : "Sound Off"}
    </button>
  );
}
