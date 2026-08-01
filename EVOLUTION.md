
## [2026-08-01 15:00] refactor: Consolidate exercise data into PoseDetector
- Moved `EXERCISES` array and `Exercise` interface directly into `src/components/PoseDetector.tsx`.
- Added `getExerciseById` helper function within `PoseDetector.tsx` for cleaner access.
- Updated `src/app/workout/page.tsx` to import `getExerciseById` from `PoseDetector.tsx` and use it to select the current exercise.
- Streamlined exercise data management by centralizing definitions with the detection logic.
- Build succeeded and deployed to Vercel.
