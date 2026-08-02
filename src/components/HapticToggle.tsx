"use client";
import { useState } from "react";
import { Vibrate, VibrateOff } from "lucide-react";

// ============================================================
// Haptic Toggle — enable/disable vibration feedback
// ============================================================
export default function HapticToggle() {
  const [enabled, setEnabled] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("cali_haptic") !== "off";
  });

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    localStorage.setItem("cali_haptic", next ? "on" : "off");
    // Test vibration on enable
    if (next && "vibrate" in navigator) {
      navigator.vibrate(50);
    }
  };

  return (
    <button
      onClick={toggle}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold border border-slate-700"
    >
      <span>{enabled ? <Vibrate className="h-4 w-4" /> : <VibrateOff className="h-4 w-4" />}</span>
      {enabled ? "Haptic On" : "Haptic Off"}
    </button>
  );
}
