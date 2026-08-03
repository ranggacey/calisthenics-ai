// ============================================================
// Local JSON storage for Calisthenics AI Trainer
// Semua data workout disimpan di localStorage — TANPA database.
// ============================================================

export interface WorkoutStats {
  totalReps: number;
  totalWorkouts: number;
  streak: number;
  lastWorkoutDate: string | null;
  bestSet: number;
  byExercise: Record<string, number>;
}

export interface SessionRecord {
  date: string;
  exercise: string;
  reps: number;
  duration: number;
}

export interface ChallengeProgress {
  exercise: string;
  count: number;
}

export interface DailyLog {
  date: string;
  byExercise: Record<string, number>;
  workouts: number;
}

export const STATS_KEY = "cali_stats";
export const HISTORY_KEY = "cali_history";
export const CHALLENGE_KEY = "cali_challenge";
export const DAILY_KEY = "cali_daily";
export const ACHIEVEMENTS_KEY = "cali_achievements";
export const SOUND_KEY = "cali_sound";

export const defaultStats: WorkoutStats = {
  totalReps: 0,
  totalWorkouts: 0,
  streak: 0,
  lastWorkoutDate: null,
  bestSet: 0,
  byExercise: {},
};

export function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    // Notify komponen di TAB YANG SAMA (storage event asli hanya antar-tab).
    // Handler komponen hanya baca localStorage, jadi tidak ada loop.
    window.dispatchEvent(new Event("storage"));
  } catch {
    /* storage full — ignore */
  }
}

/** Tanggal lokal (bukan UTC) dalam format YYYY-MM-DD — WIB user di Indonesia */
export function localDateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// ---------- Stats ----------
export function loadStats(): WorkoutStats {
  return readJson<WorkoutStats>(STATS_KEY, defaultStats);
}

export function saveWorkoutSession(exerciseId: string, reps: number, durationSec: number) {
  const stats = loadStats();
  stats.totalReps += reps;
  stats.totalWorkouts += 1;
  stats.bestSet = Math.max(stats.bestSet, reps);
  stats.byExercise[exerciseId] = (stats.byExercise[exerciseId] ?? 0) + reps;
  const today = localDateKey();
  if (stats.lastWorkoutDate !== today) {
    if (stats.lastWorkoutDate) {
      const yesterday = localDateKey(new Date(Date.now() - 86400000));
      stats.streak = stats.lastWorkoutDate === yesterday ? stats.streak + 1 : 1;
    } else {
      stats.streak = 1;
    }
    stats.lastWorkoutDate = today;
  }
  writeJson(STATS_KEY, stats);
}

// ---------- History ----------
export function loadHistory(): SessionRecord[] {
  return readJson<SessionRecord[]>(HISTORY_KEY, []);
}

export function logSession(exercise: string, reps: number, duration: number) {
  const list = loadHistory();
  list.push({ date: new Date().toISOString(), exercise, reps, duration });
  writeJson(HISTORY_KEY, list.slice(-50));
}

// ---------- Seasonal challenge ----------
export function loadChallenge(): ChallengeProgress {
  return readJson<ChallengeProgress>(CHALLENGE_KEY, { exercise: "pushup", count: 0 });
}

export function addChallengeReps(exerciseId: string, reps: number) {
  const c = loadChallenge();
  if (c.exercise !== exerciseId && c.count === 0) {
    c.exercise = exerciseId;
  }
  // Challenge aktif menuju goal 250 — semua reps (squat/pushup/plank) masuk
  c.count += reps;
  writeJson(CHALLENGE_KEY, c);
}

// ---------- Daily log (harian, reset otomatis per tanggal LOKAL) ----------
export function todayKey(): string {
  return localDateKey();
}

export function loadDailyLog(): DailyLog {
  const parsed = readJson<DailyLog>(DAILY_KEY, { date: todayKey(), byExercise: {}, workouts: 0 });
  if (parsed.date !== todayKey()) {
    return { date: todayKey(), byExercise: {}, workouts: 0 };
  }
  return parsed;
}

export function addDailyWorkout(exerciseId: string, reps: number) {
  const log = loadDailyLog();
  log.byExercise[exerciseId] = (log.byExercise[exerciseId] ?? 0) + reps;
  log.workouts += 1;
  writeJson(DAILY_KEY, log);
}

// ---------- Achievements ----------
export function loadAchievements(): string[] {
  return readJson<string[]>(ACHIEVEMENTS_KEY, []);
}

export function saveAchievements(ids: string[]) {
  writeJson(ACHIEVEMENTS_KEY, ids);
}
