"use client";

import { useState, useCallback } from "react";
import { ffmpegEngine }          from "@/lib/ffmpeg";
import type { FilterParams, ExportResult, ExportProgress, ExportPhase } from "@/lib/ffmpeg";

export type ExportStatus = "idle" | "loading" | "exporting" | "done" | "error";

export interface UseExportReturn {
  run:      (src: File | string, params: FilterParams, name?: string) => Promise<void>;
  status:   ExportStatus;
  progress: number;
  phase:    ExportPhase | "";
  label:    string;
  result:   ExportResult | null;
  error:    string | null;
  reset:    () => void;
}

export function useFFmpegExport(): UseExportReturn {
  const [status,   setStatus]   = useState<ExportStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [phase,    setPhase]    = useState<ExportPhase | "">("");
  const [label,    setLabel]    = useState("");
  const [result,   setResult]   = useState<ExportResult | null>(null);
  const [error,    setError]    = useState<string | null>(null);

  const run = useCallback(async (src: File | string, params: FilterParams, name = "safe_export.mp4") => {
    setStatus("loading"); setProgress(0); setResult(null); setError(null);
    try {
      const out = await ffmpegEngine.exportSafeVideo(src, params, name, (p: ExportProgress) => {
        setPhase(p.phase); setLabel(p.label); setProgress(p.pct);
        if (p.phase !== "load") setStatus("exporting");
      });
      setResult(out); setStatus("done"); setProgress(100);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus("error");
    }
  }, []);

  const reset = useCallback(() => {
    setStatus("idle"); setProgress(0); setPhase(""); setLabel(""); setResult(null); setError(null);
  }, []);

  return { run, status, progress, phase, label, result, error, reset };
}
