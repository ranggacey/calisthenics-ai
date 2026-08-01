"use client";

// ============================================================
// Calisthenics AI Trainer — core workout engine (client-side)
// Rep counting berbasis GERAKAN ASLI pengguna, dengan guard ketat:
//   - EMA smoothing anti-noise
//   - Frame confirmation (butuh N frame berturut-turut) anti-flip-flop
//   - Min hold time di posisi bawah (push-up beneran ada jeda di bawah)
//   - Bilateral check: kedua sisi tubuh konsisten (bukan goyangan satu tangan)
//   - Body straightness: badan harus lurus (pinggul gak drop)
//   - Form jelek = reps TIDAK nambah
// ============================================================
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
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
  /** Landmark triplet [joint, middle, joint] untuk angle utama */
  keypoints: [number, number, number];
  /** Triplet angle kiri [shoulder, elbow, wrist] */
  leftTriplet: [number, number, number];
  /** Triplet angle kanan [shoulder, elbow, wrist] */
  rightTriplet: [number, number, number];
  /** Triplet straightness badan [hip, shoulder, elbow] */
  straightTriplet: [number, number, number];
  /** Angle saat posisi bawah (tertekuk penuh) — strict */
  downAngle: number;
  /** Angle saat posisi atas (lurus/berdiri) — strict */
  upAngle: number;
  /** Angle target saat fase bawah */
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
    keypoints: [23, 25, 27],
    leftTriplet: [23, 25, 27],
    rightTriplet: [24, 26, 28],
    straightTriplet: [11, 23, 25], // shoulder-hip-knee → badan tegak
    downAngle: 100, // jongkok penuh
    upAngle: 160, // berdiri tegak
    targetAngle: 90,
    angleTolerance: 20, // 70–110 = form bagus
    unit: "squats",
  },
  {
    id: "pushup",
    name: "Push-Up",
    keypoints: [11, 13, 15],
    leftTriplet: [11, 13, 15],
    rightTriplet: [12, 14, 16],
    straightTriplet: [23, 11, 12], // hip kiri - shoulder kiri - shoulder kanan → badan lurus
    downAngle: 90, // siku tekuk penuh, dada dekat lantai
    upAngle: 160, // lengan lurus penuh
    targetAngle: 90,
    angleTolerance: 20, // 70–110 = form bagus
    unit: "push-ups",
  },
  {
    id: "plank",
    name: "Plank",
    keypoints: [23, 11, 12], // hip kiri - shoulder kiri - shoulder kanan → badan lurus
    leftTriplet: [23, 25, 27],
    rightTriplet: [24, 26, 28],
    straightTriplet: [23, 11, 12],
    downAngle: 0,
    upAngle: 0,
    targetAngle: 180,
    angleTolerance: 15, // 165–195 = badan lurus
    isHold: true,
    unit: "seconds",
  },
];

// Helper untuk ambil exercise berdasarkan ID
export function getExerciseById(id: string): Exercise {
  const found = EXERCISES.find((e) => e.id === id);
  if (!found) {
    console.warn(`Exercise with ID '${id}' not found. Defaulting to '${EXERCISES[0].id}'.`);
    return EXERCISES[0];
  }
  return found;
}

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

function badFormReason(angle: number, bilateralOk: boolean, straightOk: boolean): string {
  if (!straightOk) return "Bad form: Keep your back straight!";
  if (!bilateralOk) return "Bad form: Adjust body balance!";
  if (angle > 150) return "Bad form: Go deeper!"; // terlalu tinggi (misal squat kurang dalam)
  if (angle < 80) return "Bad form: Don't go too low!"; // terlalu rendah (misal squat terlalu dalam)
  return "Bad form: Adjust your position!";
}

// ---------- Component ----------
interface PoseDetectorProps {
  exerciseId?: string;
}

// Guard parameters — biar rep cuma kehitung pas gerakan beneran
const REQUIRED_FRAMES = 5; // frame berturut-turut untuk konfirmasi transisi
const MIN_HOLD_MS = 250; // minimal jeda di posisi bawah
const REP_COOLDOWN_MS = 800; // jeda minimal antar rep
const EMA_ALPHA = 0.35; // smoothing factor (0-1, makin kecil makin halus)
const BILATERAL_TOLERANCE = 40; // selisih max angle kiri vs kanan (derajat)
const STRAIGHT_TOLERANCE = 25; // deviasi max dari badan lurus

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

    // refs lokal rep logic (anti stale closure)
    let phase: Phase = "up";
    let smoothAngle = 0; // EMA smoothed angle
    let hasSmoothInit = false;
    let downFrames = 0; // frame berturut-turut di zona bawah
    let upFrames = 0; // frame berturut-turut di zona atas
    let downAt = 0; // timestamp saat fase down terkonfirmasi
    let goodDown = false; // form bagus saat di bawah
    let lastRepAt = 0;
    let lastFormMsg = "";
    let plankStart = 0;
    let plankAccum = 0;
    let lastFrameAt = Date.now();

    const pushMsg = (s: RepState, msg: string) => {
      if (msg !== lastFormMsg) {
        lastFormMsg = msg;
        setState((prev) => ({ ...prev, formMessage: msg }));
      }
    };

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
            // Yuna debug log
            // console.log("Angles:", { rawAngle: rawAngle.toFixed(0), smoothAngle: angle.toFixed(0), leftAngle: leftAngle?.toFixed(0), rightAngle: rightAngle?.toFixed(0), straightAngle: straightAngle?.toFixed(0) });
            // console.log("Form Checks:", { isDown, isUp, mainFormOk, bilateralOk, straightOk });

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
            if (!a || !b || !c) return;

            const rawAngle = angleBetween(a, b, c);

            if (exercise.isHold) {
              // ----- PLANK: hitung detik selama badan lurus -----
              const good = Math.abs(rawAngle - exercise.targetAngle) <= exercise.angleTolerance;
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
            // EMA smoothing
            if (!hasSmoothInit) {
              smoothAngle = rawAngle;
              hasSmoothInit = true;
            } else {
              smoothAngle = smoothAngle * (1 - EMA_ALPHA) + rawAngle * EMA_ALPHA;
            }
            const angle = smoothAngle;

            // Bilateral check — kedua sisi tubuh harus konsisten
            const [l1, l2, l3] = exercise.leftTriplet;
            const [r1, r2, r3] = exercise.rightTriplet;
            const leftAngle = lm[l1] && lm[l2] && lm[l3] ? angleBetween(lm[l1], lm[l2], lm[l3]) : angle;
            const rightAngle = lm[r1] && lm[r2] && lm[r3] ? angleBetween(lm[r1], lm[r2], lm[r3]) : angle;
            const bilateralOk = Math.abs(leftAngle - rightAngle) <= BILATERAL_TOLERANCE;

            // Body straightness — badan harus lurus (hip drop detection)
            const [s1, s2, s3] = exercise.straightTriplet;
            const straightAngle =
              lm[s1] && lm[s2] && lm[s3] ? angleBetween(lm[s1], lm[s2], lm[s3]) : 180;
            const straightOk = Math.abs(straightAngle - 180) <= STRAIGHT_TOLERANCE;

            const isDown = angle <= exercise.downAngle; // tertekuk penuh
            const isUp = angle >= exercise.upAngle; // lurus penuh
            const mainFormOk = Math.abs(angle - exercise.targetAngle) <= exercise.angleTolerance;
            const formOk = mainFormOk && bilateralOk && straightOk;

            // Frame confirmation counters
            if (isDown) {
              downFrames += 1;
              upFrames = 0;
            } else if (isUp) {
              upFrames += 1;
              downFrames = 0;
            } else {
              // Zona tengah — reset kedua counter (anti flip-flop cepat)
              downFrames = 0;
              upFrames = 0;
            }

            if (phase === "up" && downFrames >= REQUIRED_FRAMES) {
              // Turun terkonfirmasi
              phase = "down";
              downAt = now;
              goodDown = formOk;
              if (formOk) {
                setState((s) => ({ ...s, phase: "down", formGood: true, formMessage: "Good — hold & push up!" }));
              } else {
                setState((s) => ({ ...s, phase: "down", formGood: false, formMessage: badFormReason(angle, bilateralOk, straightOk) }));
                playFormBeep();
              }
            } else if (phase === "down") {
              // Update form live selama di bawah
              const heldEnough = now - downAt >= MIN_HOLD_MS;
              if (heldEnough && formOk) goodDown = true;
              if (!formOk) {
                setState((s) => ({ ...s, formGood: false, formMessage: badFormReason(angle, bilateralOk, straightOk) }));
              } else if (!heldEnough) {
                setState((s) => ({ ...s, formGood: true, formMessage: "Hold 0.3s at bottom..." }));
              }
            }

            if (phase === "down" && upFrames >= REQUIRED_FRAMES && now - downAt >= MIN_HOLD_MS) {
              // Naik terkonfirmasi — rep selesai kalau form bagus
              phase = "up";
              const cooldownOk = now - lastRepAt > REP_COOLDOWN_MS;
              if (goodDown && formOk && cooldownOk) {
                lastRepAt = now;
                sessionRepsRef.current += 1;
                setState((s) => ({
                  ...s,
                  phase: "up",
                  repCount: s.repCount + 1,
                  formGood: true,
                  formMessage: "Nice! Keep going 💪",
                }));
                playRepBeep();
              } else if (goodDown && !formOk) {
                setState((s) => ({ ...s, phase: "up", formGood: false, formMessage: "Straighten up fully — rep not counted!" }));
              } else if (!goodDown) {
                setState((s) => ({ ...s, phase: "up", formGood: false, formMessage: "Rep not counted — full range needed!" }));
              } else {
                setState((s) => ({ ...s, phase: "up", formGood: true, formMessage: "Stand by..." }));
              }
              goodDown = false;
              downFrames = 0;
              upFrames = 0;
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



