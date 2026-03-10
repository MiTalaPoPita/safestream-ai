"use client";

// lib/useFlickerDetector.ts
// Bridges <video> → off-screen canvas → Web Worker → React state.
// Uses requestVideoFrameCallback (rVFC) where available, falls back to rAF.

import { useState, useEffect, useRef, useCallback } from "react";

export interface FlickerResult {
  riskLevel:        "SAFE" | "CAUTION" | "DANGER";
  filterIntensity:  number;
  flashHz:          number;
  currentLuminance: number;
  luminanceDelta:   number;
  relativeChange:   number;
  shouldFilter:     boolean;
  isUnsafe:         boolean;
  frames:           number;
  shielded:         number;
  dangers:          number;
}

const DEFAULT: FlickerResult = {
  riskLevel:"SAFE", filterIntensity:0, flashHz:0, currentLuminance:0,
  luminanceDelta:0, relativeChange:0, shouldFilter:false, isUnsafe:false,
  frames:0, shielded:0, dangers:0,
};

export function useFlickerDetector(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  enabled = true
): FlickerResult {
  const workerRef = useRef<Worker | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef    = useRef<number>(0);
  const [result, setResult] = useState<FlickerResult>(DEFAULT);

  // Boot worker once
  useEffect(() => {
    const w = new Worker("/workers/flickerWorker.js");
    workerRef.current = w;
    w.onmessage = (e: MessageEvent<FlickerResult>) => setResult(e.data);
    w.onerror   = console.error;

    const c = document.createElement("canvas");
    c.width = 320; c.height = 180;
    canvasRef.current = c;

    return () => { w.terminate(); cancelAnimationFrame(rafRef.current); };
  }, []);

  const postFrame = useCallback((timestamp: number) => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    const worker = workerRef.current;
    if (!video || !canvas || !worker || video.paused || video.ended) return;
    const ctx = canvas.getContext("2d", { willReadFrequently:true });
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, 320, 180);
    const { data } = ctx.getImageData(0, 0, 320, 180);
    const copy = new Uint8ClampedArray(data);
    worker.postMessage({ pixels:copy, timestamp }, [copy.buffer]);
  }, [videoRef]);

  useEffect(() => {
    if (!enabled) { cancelAnimationFrame(rafRef.current); setResult(DEFAULT); return; }
    const video = videoRef.current;

    if (video && "requestVideoFrameCallback" in video) {
      // Per-decoded-frame callback — most accurate
      let id = 0;
      const loop = (_now: number, meta: { mediaTime: number }) => {
        postFrame(meta.mediaTime * 1000);
        id = (video as any).requestVideoFrameCallback(loop);
      };
      id = (video as any).requestVideoFrameCallback(loop);
      return () => (video as any).cancelVideoFrameCallback(id);
    } else {
      // rAF fallback
      const loop = (ts: number) => { postFrame(ts); rafRef.current = requestAnimationFrame(loop); };
      rafRef.current = requestAnimationFrame(loop);
      return () => cancelAnimationFrame(rafRef.current);
    }
  }, [videoRef, enabled, postFrame]);

  return result;
}
