"use client";
import React, { useEffect, useRef } from "react";
import type { ExerciseId, LandmarkMap } from "@/lib/exercises";
import { RepTracker } from "@/lib/exercises";

interface PoseDetectorProps {
  exercise: ExerciseId;
  onRep: (frame: {
    reps: number;
    formGood: boolean;
    angle: number | null;
    repCompleted: boolean;
  }) => void;
}

export default function PoseDetector({ exercise, onRep }: PoseDetectorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trackerRef = useRef(new RepTracker());
  const onRepRef = useRef(onRep);
  onRepRef.current = onRep;

  // Reset rep counter whenever the selected exercise changes.
  useEffect(() => {
    trackerRef.current.reset();
  }, [exercise]);

  useEffect(() => {
    const loadMediaPipe = async () => {
      const { Pose } = await import("@mediapipe/pose");
      const { Camera } = await import("@mediapipe/camera_utils");
      const { drawConnectors, drawLandmarks } = await import(
        "@mediapipe/drawing_utils"
      );

      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;

      const pose = new Pose({
        locateFile: (file) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
      });

      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      pose.onResults((results) => {
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

        if (results.poseLandmarks) {
          drawConnectors(
            ctx,
            results.poseLandmarks,
            [
              [11, 13],
              [13, 15],
              [12, 14],
              [14, 16],
              [11, 12],
              [23, 24],
              [23, 25],
              [25, 27],
              [24, 26],
              [26, 28],
            ],
            { color: "#00FF00", lineWidth: 5 }
          );
          drawLandmarks(ctx, results.poseLandmarks, {
            color: "#FF0000",
            lineWidth: 2,
          });

          // Real-time rep counting
          const lm: LandmarkMap = {};
          for (const [i, l] of results.poseLandmarks.entries()) {
            lm[i] = { x: l.x, y: l.y };
          }
          const frame = trackerRef.current.update(exercise, lm);
          onRepRef.current(frame);
        }
        ctx.restore();
      });

      const camera = new Camera(video, {
        onFrame: async () => {
          await pose.send({ image: video });
        },
        width: 640,
        height: 480,
      });
      camera.start();
    };

    loadMediaPipe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col items-center">
      <video ref={videoRef} className="hidden" />
      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        className="border border-gray-300 rounded-lg w-full max-w-2xl"
      />
    </div>
  );
}
