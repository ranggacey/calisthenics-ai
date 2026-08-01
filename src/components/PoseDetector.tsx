"use client";

// ============================================================
// Calisthenics AI Trainer — core workout engine (client-side)
// Rep counting berbasis GERAKAN ASLI pengguna:
//   - Push-Up/Squat: posisi atas → bawah (full range) → atas lagi = 1 rep
//   - Form jelek (range gerak kurang / angle di luar toleransi) = reps TIDAK nambah
//   - Plank: hold timer selama badan lurus
// ============================================================
import { useEffect, useRef, useState, useCallback } from "react";
import {
  loadStats,
  saveWorkoutSession,
  logSession,
  addChallengeReps,
  addDailyWorkout,
  type WorkoutStats,
} from "@/lib/storage";

// ---------- Types ----------
export interface Exercise {
  id: string;
  name: string;
  /** Landmark triplet [joint, middle, joint] used to compute the angle */
  keypoints: [number, number, number];
  /** Angle saat posisi bawah (tertekuk penuh) */
  downAngle: number;
  /** Angle saat posisi atas (lurus/berdiri) */
  upAngle: number;
  /** Rentang angle yang dianggap form BAGUS saat fase bawah */
  targetAngle: number;
  angleTolerance: number;
  /** Plank mode: hitung detik, bukan rep */
  isHold?: boolean;
  unit: string;
}

export const EXERCISES: Exercise[] = [
  {
    id: "squat",
    name: "Squat",
    // hip(23) - knee(25) - ankle(27) → knee angle
    keypoints: [23, 25, 27],
    downAngle: 100, // jongkok penuh
    upAngle: 155, // berdiri tegak
    targetAngle: 90,
    angleTolerance: 25, // 65–115 = form bagus
    unit: "squats",
  },
  {
    id: "pushup",
    name: "Push-Up",
    // shoulder(11) - elbow(13) - wrist(15) → elbow angle
    keypoints: [11, 13, 15],
    downAngle: 100, // dada dekat lantai
    upAngle: 150, // lengan lurus
    targetAngle: 90,
    angleTolerance: 25, // 65–115 = form bagus
    unit: "push-ups",
  },
  {
    id: "plank",
    name: "Plank",
    // hip(23) - shoulder(11) - elbow(13) → body straightness
    keypoints: [23, 11, 13],
    downAngle: 0,
    upAngle: 0,
    targetAngle: 170,
    angleTolerance: 15, // 155–185 = badan lurus
    isHold: true,
    unit: "seconds",
  },
];

// ---------- Rep counting state machine ----------
type Phase = "up" | "down";

export interface RepState {
  phase: Phase;
  repCount: number;
  formGood: boolean;
  formMessage: string;
  isPaused: boolean;
}

const initialState: RepState = {
  phase: "up",
  repCount: 0,
  formGood: true,
  formMessage: "Stand by...",
  isPaused: false,
};

// ---------- Angle helper ----------
function angleBetween(a: { x: number; y: number }, b: { x: number; y: number }, c: { x: number; y: number }): number {
  const abx = a.x - b.x;
  const aby = a.y - b.y;
  const cbx = c.x - b.x;
  const cby = c.y - b.y;
  const dot = abx * cbx + aby * cby;
  const cross = Math.abs(abx * cby - aby * cbx);
  return Math.atan2(cross, dot) * (180 / Math.PI);
}

// ---------- Audio feedback (Web Audio API) ----------
let audioCtx: AudioContext | null = null;

function beep(freq: number, durationMs = 80) {
  try {
    if (typeof window === "undefined") return;
    if (localStorage.getItem("cali_sound") === "off") return;
    if (!audioCtx) audioCtx = new AudioContext();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = "square";
    gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + durationMs / 1000);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + durationMs / 1000);
  } catch {
    /* audio blocked — ignore */
  }
}

function playRepBeep() {
  beep(880);
}

function playFormBeep() {
  beep(220, 160);
}

// ---------- Component ----------
interface PoseDetectorProps {
  exerciseId?: string;
}

const REP_COOLDOWN_MS = 600;

export default function PoseDetector({ exerciseId = "squat" }: PoseDetectorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<RepState>(initialState);
  const [stats, setStats] = useState<WorkoutStats>(loadStats);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  const exercise = EXERCISES.find((e) => e.id === exerciseId) ?? EXERCISES[0];

  const sessionRepsRef = useRef(0);
  const sessionStartRef = useRef(Date.now());

  // --- main loop: MediaPipe pose + movement-based rep logic ---
  useEffect(() => {
    let disposed = false;
    let pose: any = null;
    let camera: any = null;

    // refs lokal untuk rep logic (anti stale closure)
    let phase: Phase = "up";
    let goodDown = false; // pernah gak angle good saat posisi bawah di rep ini
    let lastRepAt = 0;
    let formWarned = false;
    let plankStart = 0; // timestamp saat plank mulai good
    let plankAccum = 0; // detik plank terakumulasi
    let lastFrameAt = Date.now();

    const load = async () => {
      try {
        const { Pose } = await import("@mediapipe/pose");
        const { Camera } = await import("@mediapipe/camera_utils");
        const { drawConnectors, drawLandmarks } = await import("@mediapipe/drawing_utils");

        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;

        pose = new Pose({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}` });
        pose.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        const current = () => stateRef.current;

        pose.onResults((results: any) => {
          if (disposed) return;
          const ctx = canvas.getContext("2d");
          if (!ctx) return;
          ctx.save();
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

          const lm = results.poseLandmarks;
          const st = current();
          const now = Date.now();
          const dt = (now - lastFrameAt) / 1000;
          lastFrameAt = now;

          if (lm && !st.isPaused) {
            // Draw skeleton
            drawConnectors(
              ctx,
              lm,
              [
                [11, 13], [13, 15], [12, 14], [14, 16], [11, 12],
                [23, 24], [23, 25], [25, 27], [24, 26], [26, 28],
              ],
              { color: "#22c55e", lineWidth: 5 }
            );
            drawLandmarks(ctx, lm, { color: "#ef4444", lineWidth: 2, radius: 4 });

            const [aIdx, bIdx, cIdx] = exercise.keypoints;
            const a = lm[aIdx];
            const b = lm[bIdx];
            const c = lm[cIdx];

            if (a && b && c) {
              const angle = angleBetween(a, b, c);

              if (exercise.isHold) {
                // ----- PLANK: hitung detik selama badan lurus -----
                const good = Math.abs(angle - exercise.targetAngle) <= exercise.angleTolerance;
                if (good) {
                  if (plankStart === 0) plankStart = now;
                  plankAccum += dt;
                  const secs = Math.floor(plankAccum);
                  sessionRepsRef.current = secs;
                  if (secs !== stateRef.current.repCount) {
                    setState((s) => ({ ...s, formGood: true, repCount: secs, formMessage: `Keep it straight! ${secs}s` }));
                  }
                } else {
                  if (plankStart !== 0) {
                    plankStart = 0;
                    setState((s) => ({ ...s, formGood: false, formMessage: "Hips dropping! Straighten your body" }));
                    playFormBeep();
                  }
                }
                return;
              }

              // ----- PUSH-UP / SQUAT: movement-based rep counting -----
              const isDown = angle <= exercise.downAngle; // turun penuh
              const isUp = angle >= exercise.upAngle; // naik penuh
              const good = Math.abs(angle - exercise.targetAngle) <= exercise.angleTolerance;

              if (isDown && phase === "up") {
                // Mulai turun — cek form
                phase = "down";
                if (good) {
                  goodDown = true;
                  setState((s) => ({ ...s, phase: "down", formGood: true, formMessage: "Good form — push up!" }));
                } else {
                  setState((s) => ({ ...s, phase: "down", formGood: false, formMessage: "Too shallow! Full range needed" }));
                  if (!formWarned) {
                    formWarned = true;
                    playFormBeep();
                  }
                }
              } else if (isUp && phase === "down") {
                // Naik lagi — rep selesai (kalau form bagus & cooldown lewat)
                phase = "up";
                const cooldownOk = now - lastRepAt > REP_COOLDOWN_MS;
                if (goodDown && cooldownOk) {
                  lastRepAt = now;
                  sessionRepsRef.current += 1;
                  setState((s) => {
                    const next = { ...s, phase: "up" as Phase, repCount: s.repCount + 1, formGood: true, formMessage: "Nice! Keep going 💪" };
                    return next;
                  });
                  playRepBeep();
                } else if (!goodDown) {
                  setState((s) => ({ ...s, phase: "up", formGood: false, formMessage: "Rep not counted — full range needed!" }));
                }
                goodDown = false;
                formWarned = false;
              } else if (isDown && phase === "down") {
                // Masih di bawah — update form live
                const g = Math.abs(angle - exercise.targetAngle) <= exercise.angleTolerance;
                if (g) goodDown = true;
                setState((s) => ({ ...s, formGood: g, formMessage: g ? "Hold — push up!" : "Adjust: too deep / too shallow" }));
              }
            }
          }
          ctx.restore();
        });

        camera = new Camera(video, {
          onFrame: async () => {
            await pose.send({ image: video });
          },
          width: 640,
          height: 480,
        });
        await camera.start();
      } catch (err: any) {
        if (!disposed) {
          setCameraError(err?.message ?? "Camera failed to start. Check permissions.");
        }
      }
    };

    load();
    return () => {
      disposed = true;
      try {
        camera?.stop?.();
      } catch {
        /* noop */
      }
    };
  }, [exerciseId]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- persist session on finish ---
  const finishSession = useCallback(() => {
    if (sessionRepsRef.current > 0) {
      const duration = Math.round((Date.now() - sessionStartRef.current) / 1000);
      const reps = sessionRepsRef.current;
      saveWorkoutSession(exercise.id, reps, duration);
      logSession(exercise.id, reps, duration);
      addChallengeReps(exercise.id, reps);
      addDailyWorkout(exercise.id, reps);
      setStats(loadStats());
      setState((s) => ({ ...s, repCount: 0, phase: "up", formMessage: "Saved! Great work 💪" }));
      sessionRepsRef.current = 0;
      sessionStartRef.current = Date.now();
    }
  }, [exercise.id]);

  const togglePause = () => {
    setState((s) => ({ ...s, isPaused: !s.isPaused, formMessage: s.isPaused ? "Go!" : "Paused" }));
  };

  const resetSession = () => {
    setState((s) => ({ ...s, repCount: 0, phase: "up", formMessage: "Stand by..." }));
    sessionRepsRef.current = 0;
    sessionStartRef.current = Date.now();
  };

  return (
    <div className="flex flex-col items-center w-full">
      <div className="relative w-full max-w-[640px]">
        <video ref={videoRef} className="hidden" />
        <canvas ref={canvasRef} width={640} height={480} className="w-full rounded-xl border-2 border-slate-700 shadow-lg bg-black" />
        {cameraError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-red-400 font-semibold p-4 text-center">
            {cameraError}
          </div>
        )}
        <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/60 text-white text-sm font-semibold">
          {exercise.name}
        </div>
        <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-black/60 text-white text-sm font-mono">
          {exercise.isHold ? `Time: ${state.repCount}s` : `Reps: ${state.repCount}`}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 w-full max-w-[640px] text-center">
        <div className="rounded-lg bg-slate-800 p-3">
          <p className="text-xs uppercase text-slate-400">Position</p>
          <p className="text-xl font-bold text-white">{state.phase === "up" ? "UP" : "DOWN"}</p>
        </div>
        <div className="rounded-lg bg-slate-800 p-3">
          <p className="text-xs uppercase text-slate-400">Form</p>
          <p className={`text-xl font-bold ${state.formGood ? "text-green-400" : "text-red-400"}`}>
            {state.formGood ? "Good" : "Fix"}
          </p>
        </div>
        <div className="rounded-lg bg-slate-800 p-3">
          <p className="text-xs uppercase text-slate-400">Count</p>
          <p className="text-xl font-bold text-white">{state.repCount}</p>
        </div>
      </div>

      <p className="mt-3 text-slate-300 text-sm font-medium">{state.formMessage}</p>

      <div className="mt-4 flex gap-3">
        <button
          onClick={togglePause}
          className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-semibold"
        >
          {state.isPaused ? "Resume" : "Pause"}
        </button>
        <button
          onClick={resetSession}
          className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-600 text-white font-semibold"
        >
          Reset
        </button>
        <button
          onClick={finishSession}
          className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
        >
          Finish & Save
        </button>
      </div>
    </div>
  );
}
