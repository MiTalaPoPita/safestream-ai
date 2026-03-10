"use client";

// lib/ffmpeg.ts
// Wraps @ffmpeg/ffmpeg (WASM) to produce a safe-video export.
// REQUIRES cross-origin isolation (COOP+COEP headers in next.config.js).
//
// FFmpeg filter chain baked into output:
//   eq=brightness={b}:contrast={c}:saturation=0.88
//   gblur=sigma={blur}
//   colorlevels=rimax=0.93:gimax=0.93:bimax=0.93
//   -c:v libx264 -crf 18 -preset fast -movflags +faststart

import { FFmpeg }              from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

export interface FilterParams {
  brightness: number;   // [-1, 1]   default -0.15
  contrast:   number;   // [0, 2]    default  0.72
  blur:       number;   // px sigma  default  1.2
}

export interface ExportResult {
  url:      string;   // Object URL — use as <a href> download
  filename: string;
  sizeKB:   number;
}

export type ExportPhase = "load" | "read" | "filter" | "encode" | "done";

export interface ExportProgress {
  phase: ExportPhase;
  pct:   number;        // 0–100
  label: string;
}

// CDN for @ffmpeg/core WASM — pinned version
const CORE = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";

class FFmpegExportEngine {
  private _ff     = new FFmpeg();
  private _loaded = false;

  async load(onProgress?: (p: ExportProgress) => void): Promise<void> {
    if (this._loaded) return;
    onProgress?.({ phase:"load", pct:0, label:"Fetching FFmpeg.wasm engine…" });

    this._ff.on("progress", ({ progress }) => {
      onProgress?.({ phase:"encode", pct: Math.round(progress * 100), label:"Encoding H.264…" });
    });

    await this._ff.load({
      coreURL: await toBlobURL(`${CORE}/ffmpeg-core.js`,   "text/javascript"),
      wasmURL: await toBlobURL(`${CORE}/ffmpeg-core.wasm`, "application/wasm"),
    });

    this._loaded = true;
    onProgress?.({ phase:"load", pct:100, label:"Engine ready." });
  }

  async exportSafeVideo(
    source:     File | string,
    params:     FilterParams,
    filename =  "safe_export.mp4",
    onProgress?: (p: ExportProgress) => void
  ): Promise<ExportResult> {
    if (!this._loaded) await this.load(onProgress);

    const { brightness, contrast, blur } = params;

    // ── Read source ─────────────────────────────────────────────────────
    onProgress?.({ phase:"read", pct:0, label:"Reading source file…" });
    await this._ff.writeFile("input.mp4", await fetchFile(source));
    onProgress?.({ phase:"read", pct:100, label:"Source loaded." });

    // ── Transcode with Digital Sunglasses filter graph ──────────────────
    onProgress?.({ phase:"filter", pct:0, label:"Applying Digital Sunglasses filter…" });

    const vf = [
      `eq=brightness=${brightness.toFixed(3)}:contrast=${contrast.toFixed(3)}:saturation=0.88`,
      `gblur=sigma=${blur.toFixed(2)}`,
      `colorlevels=rimax=0.93:gimax=0.93:bimax=0.93`,
    ].join(",");

    await this._ff.exec([
      "-i",        "input.mp4",
      "-vf",       vf,
      "-c:v",      "libx264",
      "-crf",      "18",
      "-preset",   "fast",
      "-c:a",      "copy",
      "-movflags", "+faststart",
      filename,
    ]);

    // ── Package output ──────────────────────────────────────────────────
    onProgress?.({ phase:"done", pct:100, label:"Export complete." });

    const data = await this._ff.readFile(filename);
    const blob = new Blob([data], { type:"video/mp4" });

    await this._ff.deleteFile("input.mp4");
    await this._ff.deleteFile(filename);

    return { url: URL.createObjectURL(blob), filename, sizeKB: Math.round(blob.size / 1024) };
  }
}

// Singleton
export const ffmpegEngine = new FFmpegExportEngine();
