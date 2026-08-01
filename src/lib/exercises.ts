/**
 * Exercise definitions + real-time rep counting logic.
 *
 * MediaPipe Pose landmark indices (https://google.github.io/mediapipe/solutions/pose):
 *   11 LEFT_SHOULDER, 12 RIGHT_SHOULDER
 *   13 LEFT_ELBOW,    14 RIGHT_ELBOW
 *   15 LEFT_WRIST,    16 RIGHT_WRIST
 *   23 LEFT_HIP,      24 RIGHT_HIP
 *   25 LEFT_KNEE,     26 RIGHT_KNEE
 *   27 LEFT_ANKLE,    28 RIGHT_ANKLE
 *
 * Rep counting uses a state machine with hysteresis so a single rep is
 * counted exactly once (down-phase -> up-phase transition).
 */

export type ExerciseId = "squat" | "pushup" | "plank";

export interface ExerciseDef {
  id: ExerciseId;
  name: string;
  /** Unit shown next to the counter: reps or hold seconds. */
  unit: "reps" | "seconds";
  target: number;
  tempo: string;
  description: string;
  /** Joint angle thresholds in degrees (down/up) for rep counting. */
  downAngle: number;
  upAngle: number;
}

export const EXERCISES: ExerciseDef[] = [
  {
    id: "squat",
    name: "Squat",
    unit: "reps",
    target: 10,
    tempo: "3-1-1",
    description: "Stand tall, hips below knees at the bottom.",
    downAngle: 100,
    upAngle: 160,
  },
  {
    id: "pushup",
    name: "Push-up",
    unit: "reps",
    target: 15,
    tempo: "2-1-2",
    description: "Chest to the ground, elbows tucked.",
    downAngle: 100,
    upAngle: 150,
  },
  {
    id: "plank",
    name: "Plank",
    unit: "seconds",
    target: 60,
    tempo: "Hold",
    description: "Straight line shoulder-to-ankle, core tight.",
    downAngle: 0,
    upAngle: 150,
  },
];

export function getExercise(id: ExerciseId): ExerciseDef {
  return EXERCISES.find((e) => e.id === id) ?? EXERCISES[0];
}

export interface Point {
  x: number;
  y: number;
}

/** Angle at vertex `b` formed by points a-b-c, in degrees (0-180). */
export function computeAngle(a: Point, b: Point, c: Point): number {
  const v1 = { x: a.x - b.x, y: a.y - b.y };
  const v2 = { x: c.x - b.x, y: c.y - b.y };
  const dot = v1.x * v2.x + v1.y * v2.y;
  const mag = Math.hypot(v1.x, v1.y) * Math.hypot(v2.x, v2.y);
  if (mag === 0) return 180;
  const cos = Math.max(-1, Math.min(1, dot / mag));
  return (Math.acos(cos) * 180) / Math.PI;
}

export type LandmarkMap = Record<number, Point>;

/** Left-side joint angle used for rep counting. Returns null if landmarks missing. */
function jointAngle(
  exercise: ExerciseId,
  lm: LandmarkMap
): { bend: number | null; straight: number | null } {
  // bend: angle that decreases as the joint bends (rep progress)
  // straight: body-line angle used for plank form check
  switch (exercise) {
    case "squat":
      // hip-knee-ankle
      return {
        bend: has(lm, 23, 25, 27) ? computeAngle(lm[23], lm[25], lm[27]) : null,
        straight: null,
      };
    case "pushup":
      // shoulder-elbow-wrist
      return {
        bend: has(lm, 11, 13, 15) ? computeAngle(lm[11], lm[13], lm[15]) : null,
        straight: null,
      };
    case "plank":
      // shoulder-hip-ankle: straight body line
      return {
        bend: null,
        straight: has(lm, 11, 23, 27)
          ? computeAngle(lm[11], lm[23], lm[27])
          : null,
      };
  }
}

function has(lm: LandmarkMap, ...idx: number[]): boolean {
  return idx.every((i) => lm[i] !== undefined);
}

export interface RepFrame {
  /** Total reps counted so far (squat/pushup). */
  reps: number;
  /** Form is good on this frame (plank: straight body; others: mid-range). */
  formGood: boolean;
  /** True exactly once when a rep completes (bend returned to up-phase). */
  repCompleted: boolean;
  /** Raw joint angle for debugging / feedback. */
  angle: number | null;
}

/**
 * Hysteresis rep tracker. Call `update` once per pose frame.
 * `reset` clears state (e.g. when switching exercise).
 */
export class RepTracker {
  private phase: "up" | "down" = "up";
  private reps = 0;

  reset(): void {
    this.phase = "up";
    this.reps = 0;
  }

  update(exercise: ExerciseId, lm: LandmarkMap): RepFrame {
    const def = getExercise(exercise);
    const { bend, straight } = jointAngle(exercise, lm);

    let formGood = false;
    let repCompleted = false;

    if (exercise === "plank") {
      // Plank: no reps — form good = straight body line
      formGood = straight !== null && straight >= def.upAngle;
      return {
        reps: this.reps,
        formGood,
        repCompleted: false,
        angle: straight,
      };
    }

    if (bend === null) {
      return { reps: this.reps, formGood: false, repCompleted: false, angle: null };
    }

    // Form feedback: good when joint is meaningfully bent (not stuck in one pose)
    formGood = bend < def.downAngle + 30 || this.phase === "down";

    if (this.phase === "up" && bend < def.downAngle) {
      this.phase = "down";
    } else if (this.phase === "down" && bend > def.upAngle) {
      this.phase = "up";
      this.reps += 1;
      repCompleted = true;
    }

    return { reps: this.reps, formGood, repCompleted, angle: bend };
  }

  get count(): number {
    return this.reps;
  }
}
