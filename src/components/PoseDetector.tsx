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
import { useEffect, useRef, useState, useCallback } from "react";
import {
  saveWorkoutSession,
  logSession,
  addChallengeReps,
  addDailyWorkout,
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
  {
    id: "pullup",
    name: "Pull-Up",
    keypoints: [11, 13, 15], // shoulder-elbow-wrist (left arm)
    leftTriplet: [11, 13, 15],
    rightTriplet: [12, 14, 16],
    straightTriplet: [23, 11, 12], // hip-shoulder-shoulder → body straight
    downAngle: 160, // arms extended (hanging)
    upAngle: 60, // chin over bar
    targetAngle: 90,
    angleTolerance: 25,
    unit: "pull-ups",
  },
  {
    id: "dips",
    name: "Dips",
    keypoints: [11, 13, 15], // shoulder-elbow-wrist (left arm)
    leftTriplet: [11, 13, 15],
    rightTriplet: [12, 14, 16],
    straightTriplet: [23, 11, 12], // hip-shoulder-shoulder → body straight
    downAngle: 90, // elbows at 90°
    upAngle: 160, // arms extended
    targetAngle: 90,
    angleTolerance: 20,
    unit: "dips",
  },
  {
    id: "lunges",
    name: "Lunges",
    keypoints: [23, 25, 27], // hip-knee-ankle (left leg)
    leftTriplet: [23, 25, 27],
    rightTriplet: [24, 26, 28],
    straightTriplet: [11, 23, 25], // shoulder-hip-knee → torso upright
    downAngle: 90, // knee at 90°
    upAngle: 160, // standing
    targetAngle: 90,
    angleTolerance: 20,
    unit: "lunges",
  },
  {
    id: "crunch",
    name: "Crunch",
    keypoints: [11, 23, 25], // shoulder-hip-knee (torso angle)
    leftTriplet: [11, 13, 15],
    rightTriplet: [12, 14, 16],
    straightTriplet: [11, 23, 25], // shoulder-hip-knee → spine alignment
    downAngle: 160, // lying flat
    upAngle: 60, // crunched up
    targetAngle: 90,
    angleTolerance: 25,
    unit: "crunches",
  },
  {
    id: "burpee",
    name: "Burpee",
    keypoints: [11, 13, 15], // using pushup phase for rep counting
    leftTriplet: [11, 13, 15],
    rightTriplet: [12, 14, 16],
    straightTriplet: [23, 11, 12], // body straight during pushup
    downAngle: 90, // pushup bottom
    upAngle: 160, // standing/jump top
    targetAngle: 90,
    angleTolerance: 30,
    unit: "burpees",
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

function beep(freq: number, durationMs = 80, type: OscillatorType = "square") {
  try {
    if (typeof window === "undefined") return;
    if (localStorage.getItem("cali_sound") === "off") return;
    if (!audioCtx) audioCtx = new AudioContext();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = type;
    gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + durationMs / 1000);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + durationMs / 1000);
  } catch {
    /* audio blocked — ignore */
  }
}

// ---------- Haptic feedback (Vibration API) ----------
function vibrate(pattern: number | number[]) {
  try {
    if (typeof window === "undefined") return;
    if (localStorage.getItem("cali_haptic") === "off") return;
    if ("vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  } catch {
    /* vibration blocked — ignore */
  }
}

function playRepBeep() {
  beep(880, 100, "sine");
  vibrate(50);
}

function playFormBeep() {
  beep(220, 160, "sawtooth");
  vibrate([30, 20, 30]);
}

function playPhaseBeep() {
  beep(440, 80, "triangle");
  vibrate(30);
}

type FormPhase = "up" | "down" | "hold";

function getFormFeedback(
  exercise: Exercise,
  angle: number,
  bilateralOk: boolean,
  straightOk: boolean,
  currentPhase: FormPhase,
  reachedBottom: boolean
): string {
  if (!straightOk) return "Jaga punggung tetap lurus!";
  if (!bilateralOk) return "Sesuaikan keseimbangan tubuh!";
  if (exercise.isHold) return "Pertahankan posisi lurus!";

  // Feedback spesifik untuk rep counting (jika form dasar sudah OK)
  if (currentPhase === "down") {
    // Pengguna dalam fase 'down' - cek kedalaman
    if (angle > exercise.targetAngle + exercise.angleTolerance) {
      return "Turun lebih dalam!";
    }
  } else if (currentPhase === "up") {
    // Pengguna dalam fase 'up' - cek ekstensi
    if (angle < exercise.upAngle - 15) {
      return "Luruskan sepenuhnya di atas!";
    }
  }
  
  if (!reachedBottom && currentPhase === "up") {
    return "Turun belum cukup dalam. Rep tidak dihitung!";
  }

  return "Form bagus!";
}

// ---------- Component ----------
interface PoseDetectorProps {
  exerciseId?: string;
}

// Guard parameters — biar rep cuma kehitung pas gerakan beneran
const REQUIRED_FRAMES = 5; // frame berturut-turut untuk konfirmasi transisi
const REP_COOLDOWN_MS = 800; // jeda minimal antar rep
const EMA_ALPHA = 0.35; // smoothing factor (0-1, makin kecil makin halus)
const BILATERAL_TOLERANCE = 40; // selisih max angle kiri vs kanan (derajat)
const STRAIGHT_TOLERANCE = 25; // deviasi max dari badan lurus

export default function PoseDetector({ exerciseId = "squat" }: PoseDetectorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<RepState>(initialState);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [lastSession, setLastSession] = useState<{ reps: number; duration: number; exercise: string } | null>(null);
  const stateRef = useRef<RepState>(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const exercise = EXERCISES.find((e) => e.id === exerciseId) ?? EXERCISES[0];

  const sessionRepsRef = useRef(0);
  const sessionStartRef = useRef(0);
  useEffect(() => {
    sessionStartRef.current = Date.now();
  }, []);

  // --- main loop: MediaPipe pose + movement-based rep logic ---
  useEffect(() => {
    let disposed = false;
    let pose: import("@mediapipe/pose").Pose | null = null;
    let camera: import("@mediapipe/camera_utils").Camera | null = null;

    // refs lokal rep logic (anti stale closure)
    let phase: Phase = "up";
    let smoothAngle = 0; // EMA smoothed angle
    let hasSmoothInit = false;
    let downFrames = 0; // frame berturut-turut di zona bawah
    let upFrames = 0; // frame berturut-turut di zona atas

    let lastRepAt = 0;
    let lastFormMsg = "";
    let plankStart = 0;
    let plankAccum = 0;
    let lastFrameAt = Date.now();
    let reachedBottom = false; // Track if user reached proper bottom position
    let wasFormBad = false; // Gate beep/vibrate — hanya di transisi ke form jelek
    let needsSessionReset = true; // Reset counter saat ganti exercise (1x per effect run)

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

        pose.onResults((results: import("@mediapipe/pose").Results) => {
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
            // Reset counter sekali saat ganti exercise (user pindah latihan)
            if (needsSessionReset) {
              needsSessionReset = false;
              sessionRepsRef.current = 0;
              sessionStartRef.current = Date.now(); // durasi summary = waktu exercise aktif saja
              setState((s) => ({ ...s, repCount: 0, phase: "up", formMessage: "Stand by..." }));
            }

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

            const isDown = angle <= exercise.downAngle + 10; // tertekuk cukup (lebih forgiving)
            const isUp = angle >= exercise.upAngle - 10; // lurus cukup (lebih forgiving)
            const formOk = bilateralOk && straightOk; // form hanya cek bilateral dan straightness

            // Form message based on current angle, not rep counting logic
            const currentPhase = phase === "down" ? "down" : "up";
            if (!formOk) {
              const msg = getFormFeedback(exercise, angle, bilateralOk, straightOk, currentPhase, reachedBottom);
              pushMsg(st, msg);
              // Beep/vibrate HANYA saat transisi ke form jelek, bukan tiap frame (anti spam)
              if (!wasFormBad) {
                wasFormBad = true;
                playFormBeep();
              }
              // Jika form tidak ok, langsung tandai sebagai bad form
              setState((prev) => ({ ...prev, formGood: false, formMessage: msg }));
            } else {
              // Jika form kembali baik, hapus pesan error spesifik dan reset ke "Good form!"
              wasFormBad = false;
              pushMsg(st, "Good form!");
              setState((prev) => ({ ...prev, formGood: true }));
            }

            // Track if user reached proper bottom position during down phase
            const inTargetRange = Math.abs(angle - exercise.targetAngle) <= exercise.angleTolerance;
            if (phase === "down" && isDown && inTargetRange) {
              reachedBottom = true;
            }

            // Frame confirmation counters
            if (isDown) {
              downFrames += 1;
              upFrames = 0;
            } else if (isUp) {
              upFrames += 1;
              downFrames = 0;
            } else {
              downFrames = 0;
              upFrames = 0;
            }

            // State machine for rep counting
            if (phase === "up" && downFrames >= REQUIRED_FRAMES) {
              // Transisi ke fase "down"
              phase = "down";
              reachedBottom = false; // Reset for new rep
              setState((s) => ({ ...s, phase: "down" })); // formGood ditangani di atas
              playPhaseBeep(); // Audio/haptic cue for phase transition
            } else if (phase === "down" && upFrames >= REQUIRED_FRAMES) {
              // Transisi ke fase "up" - Rep selesai!
              phase = "up";
              const cooldownOk = now - lastRepAt > REP_COOLDOWN_MS;
              // Rep hanya terhitung jika form bagus DAN user sudah mencapai posisi bawah yang benar
              if (cooldownOk && formOk && reachedBottom) {
                lastRepAt = now;
                reachedBottom = false; // Reset for next rep
                sessionRepsRef.current += 1;
                setState((s) => ({
                  ...s,
                  phase: "up",
                  repCount: s.repCount + 1,
                  formGood: true,
                  formMessage: "Keren! Lanjut terus 💪", // reset message ke default
                }));
                playRepBeep();
              } else { // Jika rep tidak terhitung karena form jelek atau belum cukup dalam
                const msg = getFormFeedback(exercise, angle, bilateralOk, straightOk, "up", reachedBottom);
                pushMsg(st, msg);
                playFormBeep();
                setState((prev) => ({ ...prev, formGood: false }));
              }
            }
          }
          ctx.restore();
        });

        camera = new Camera(video, {
          onFrame: async () => {
            if (pose) {
              await pose.send({ image: video });
            }
          },
          width: 640,
          height: 480,
        });
        await camera.start();
      } catch (err: unknown) {
        if (!disposed) {
          let errorMessage = "Unknown camera error. Check permissions.";
          if (err instanceof Error) {
            errorMessage = err.message;
          } else if (typeof err === "string") {
            errorMessage = err;
          }
          setCameraError(errorMessage);
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
      // Show summary modal
      setLastSession({ reps, duration, exercise: exercise.name });
      setShowSummary(true);
      sessionRepsRef.current = 0;
      sessionStartRef.current = Date.now();
    }
  }, [exercise.id, exercise.name]);

  const closeSummary = () => {
    setShowSummary(false);
    setLastSession(null);
    setState((s) => ({ ...s, repCount: 0, phase: "up", formMessage: "Stand by..." }));
  };

  const togglePause = useCallback(() => {
    setState((s) => ({ ...s, isPaused: !s.isPaused, formMessage: s.isPaused ? "Go!" : "Paused" }));
  }, []);

  const resetSession = useCallback(() => {
    setState((s) => ({ ...s, repCount: 0, phase: "up", formMessage: "Stand by..." }));
    sessionRepsRef.current = 0;
    sessionStartRef.current = Date.now();
  }, []);

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

      {showSummary && lastSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl">
            <div className="text-center mb-6">
              <div className="mx-auto mb-3 w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <span className="text-3xl">💪</span>
              </div>
              <h3 className="text-2xl font-bold text-white">Workout Complete!</h3>
              <p className="mt-1 text-slate-400">{lastSession.exercise} session saved</p>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="rounded-xl bg-slate-800 p-4 text-center">
                <p className="text-3xl font-bold text-white">{lastSession.reps}</p>
                <p className="text-xs text-slate-400">{exercise.isHold ? "Seconds" : "Reps"}</p>
              </div>
              <div className="rounded-xl bg-slate-800 p-4 text-center">
                <p className="text-3xl font-bold text-white">
                  {Math.floor(lastSession.duration / 60)}:{String(lastSession.duration % 60).padStart(2, "0")}
                </p>
                <p className="text-xs text-slate-400">Duration</p>
              </div>
              <div className="rounded-xl bg-slate-800 p-4 text-center">
                <p className="text-3xl font-bold text-white">
                  {lastSession.duration > 0 ? Math.round((lastSession.reps / lastSession.duration) * 60) : 0}
                </p>
                <p className="text-xs text-slate-400">{exercise.isHold ? "Sec/min" : "Reps/min"}</p>
              </div>
            </div>

            <button
              onClick={closeSummary}
              className="w-full py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
            >
              Awesome! Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}



