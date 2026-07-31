'use client';
import { useEffect, useRef } from 'react';
import { Pose } from '@mediapipe/pose';
import { Camera } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';

export default function PoseDetector() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const pose = new Pose({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
    });

    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    pose.onResults((results) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
      if (results.poseLandmarks) {
        drawConnectors(ctx, results.poseLandmarks, [[11, 13], [13, 15], [12, 14], [14, 16], [11, 12], [23, 24], [23, 25], [25, 27], [24, 26], [26, 28]], { color: '#00FF00', lineWidth: 5 });
        drawLandmarks(ctx, results.poseLandmarks, { color: '#FF0000', lineWidth: 2 });
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
  }, []);

  return (
    <div className="flex flex-col items-center">
      <video ref={videoRef} className="hidden" />
      <canvas ref={canvasRef} width={640} height={480} className="border border-gray-300" />
    </div>
  );
}
