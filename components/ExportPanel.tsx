"use client";

// components/ExportPanel.tsx
import { useState } from "react";
import { useFFmpegExport }               from "@/hooks/useFFmpegExport";
import { generateSafeShareURL, copyToClipboard } from "@/lib/safeShare";
import type { FilterParams }             from "@/lib/ffmpeg";

interface Props {
  source:   File | string;
  srcName:  string;
  params:   FilterParams;
  onClose:  () => void;
}

const PHASE_ICON: Record<string, string> = { load:"⚙", read:"📖", filter:"🕶", encode:"🎞", done:"✓" };
const PHASE_LABEL: Record<string, string> = {
  load:   "Initialising FFmpeg.wasm…",
  read:   "Reading source file…",
  filter: "Applying Digital Sunglasses filter…",
  encode: "Encoding H.264 output…",
  done:   "Complete.",
};
const PHASES = ["load","read","filter","encode"] as const;

export function ExportPanel({ source, srcName, params, onClose }: Props) {
  const { run, status, progress, phase, label, result, error, reset } = useFFmpegExport();
  const [shareURL,  setShareURL]  = useState("");
  const [copied,    setCopied]    = useState(false);

  const outputName = srcName.replace(/\.[^.]+$/, "") + "_safestream.mp4";

  const phaseIdx  = PHASES.indexOf(phase as typeof PHASES[number]);
  const totalPct  = status === "done" ? 100
                  : phaseIdx < 0      ? 0
                  : Math.round((phaseIdx / PHASES.length) * 100 + (progress / PHASES.length));

  const handleShare = async () => {
    const { shareURL: url, isLocal } = generateSafeShareURL(source);
    setShareURL(isLocal ? "Export first to get a shareable URL." : url);
    if (!isLocal) { await copyToClipboard(url); setCopied(true); setTimeout(()=>setCopied(false),2400); }
  };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:600, background:"rgba(2,4,6,.9)", backdropFilter:"blur(20px)", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div className="glass" style={{ width:"100%", maxWidth:520, borderRadius:14, overflow:"hidden", boxShadow:"0 40px 100px rgba(0,0,0,.75)" }}>

        {/* Header */}
        <div style={{ padding:"16px 22px", display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:"1px solid var(--border)" }}>
          <div>
            <p style={{ fontFamily:"var(--font-display, Syne, sans-serif)", fontSize:14, fontWeight:700, color:"var(--text-1)" }}>Export Safe Version</p>
            <p style={{ fontFamily:"var(--font-mono, monospace)", fontSize:8.5, color:"var(--text-3)", letterSpacing:".12em", marginTop:2 }}>FFMPEG.WASM · EDGE · NO UPLOAD</p>
          </div>
          {status !== "loading" && status !== "exporting" && (
            <button onClick={onClose} style={{ background:"none", border:"none", color:"var(--text-3)", cursor:"pointer", fontSize:20, lineHeight:1 }}>×</button>
          )}
        </div>

        {/* Filter params preview */}
        <div style={{ padding:"16px 22px", borderBottom:"1px solid var(--border)" }}>
          <p style={{ fontFamily:"var(--font-mono, monospace)", fontSize:8, color:"var(--text-3)", letterSpacing:".14em", marginBottom:10 }}>BAKED FILTER PARAMETERS</p>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:9 }}>
            {([
              { label:"BRIGHTNESS", value: params.brightness.toFixed(2), color:"#38bdf8" },
              { label:"CONTRAST",   value: params.contrast.toFixed(2),   color:"#a78bfa" },
              { label:"BLUR",       value: `${params.blur.toFixed(1)}px`, color:"#10b981" },
            ] as {label:string;value:string;color:string}[]).map(({ label, value, color }) => (
              <div key={label} style={{ background:"var(--surface-2)", border:"1px solid var(--border)", borderRadius:7, padding:"9px 11px" }}>
                <p style={{ fontFamily:"var(--font-mono, monospace)", fontSize:7.5, color:"var(--text-3)", letterSpacing:".13em", marginBottom:4 }}>{label}</p>
                <p style={{ fontFamily:"var(--font-display, Syne, sans-serif)", fontSize:20, fontWeight:800, color, lineHeight:1 }}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Progress */}
        <div style={{ padding:"16px 22px", borderBottom:"1px solid var(--border)" }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
            <p style={{ fontFamily:"var(--font-mono, monospace)", fontSize:8.5, color:"var(--text-3)", letterSpacing:".12em" }}>
              {label || PHASE_LABEL[phase] || (status==="idle"?"READY":"PROCESSING…")}
            </p>
            <p style={{ fontFamily:"var(--font-mono, monospace)", fontSize:11, fontWeight:700, color: status==="done"?"#10b981":status==="error"?"#f43f5e":"var(--text-2)" }}>{totalPct}%</p>
          </div>
          <div style={{ height:2, background:"rgba(255,255,255,.06)", borderRadius:2, marginBottom:14, overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${totalPct}%`, background: status==="done"?"#10b981":status==="error"?"#f43f5e":"linear-gradient(90deg,#10b981,#38bdf8)", borderRadius:2, transition:"width 180ms ease-out" }} />
          </div>
          {/* Phase steps */}
          <div style={{ display:"flex" }}>
            {PHASES.map((ph, i) => {
              const done   = phaseIdx > i || status==="done";
              const active = phaseIdx === i && status!=="done" && status!=="idle";
              return (
                <div key={ph} style={{ flex:1, display:"flex", alignItems:"center" }}>
                  <div style={{ flex:1, textAlign:"center" }}>
                    <div style={{ width:26, height:26, borderRadius:"50%", margin:"0 auto 4px", background: done?"rgba(16,185,129,.12)":active?"rgba(16,185,129,.06)":"var(--surface-2)", border:`1px solid ${done?"rgba(16,185,129,.4)":active?"rgba(16,185,129,.25)":"var(--border)"}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, boxShadow: active?"0 0 10px rgba(16,185,129,.3)":"none", transition:"all 360ms" }}>
                      {done ? "✓" : PHASE_ICON[ph]}
                    </div>
                    <p style={{ fontFamily:"var(--font-mono, monospace)", fontSize:7, letterSpacing:".11em", color: done?"#10b981":active?"var(--text-2)":"var(--text-3)", textTransform:"uppercase" }}>{ph}</p>
                  </div>
                  {i < PHASES.length-1 && <div style={{ flex:1, height:1, background: done?"rgba(16,185,129,.25)":"var(--border)", transition:"background 360ms" }} />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div style={{ padding:"16px 22px", display:"flex", flexDirection:"column", gap:9 }}>
          {status==="done" && result && (
            <div style={{ padding:"10px 13px", borderRadius:7, background:"rgba(16,185,129,.06)", border:"1px solid rgba(16,185,129,.18)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div>
                <p style={{ fontFamily:"var(--font-mono, monospace)", fontSize:10, color:"#10b981", marginBottom:2 }}>✓ {result.filename}</p>
                <p style={{ fontFamily:"var(--font-mono, monospace)", fontSize:8, color:"var(--text-3)", letterSpacing:".1em" }}>{(result.sizeKB/1024).toFixed(1)} MB · H.264 · Digital Sunglasses baked</p>
              </div>
              <a href={result.url} download={result.filename} style={{ padding:"6px 13px", borderRadius:6, background:"rgba(16,185,129,.12)", border:"1px solid rgba(16,185,129,.3)", color:"#10b981", fontFamily:"var(--font-mono, monospace)", fontSize:9, textDecoration:"none" }}>↓ Download</a>
            </div>
          )}
          {status==="error" && error && (
            <div style={{ padding:"9px 13px", borderRadius:7, background:"rgba(244,63,94,.06)", border:"1px solid rgba(244,63,94,.2)" }}>
              <p style={{ fontFamily:"var(--font-mono, monospace)", fontSize:9.5, color:"#f43f5e" }}>⚠ {error}</p>
            </div>
          )}
          <div style={{ display:"flex", gap:9 }}>
            {(status==="idle"||status==="error") && (
              <button className="cta-primary" onClick={() => run(source, params, outputName)} style={{ flex:1, padding:"10px 0", borderRadius:7, fontSize:9.5 }}>▶ Begin Export</button>
            )}
            {status==="done" && (
              <button className="cta-primary" onClick={reset} style={{ flex:1, padding:"10px 0", borderRadius:7, fontSize:9.5 }}>↺ Export Again</button>
            )}
            <button className="cta-ghost" onClick={handleShare} style={{ flex:1, padding:"10px 0", borderRadius:7, fontSize:9.5 }}>
              {copied ? "✓ Copied!" : "⎘ Safe-Share URL"}
            </button>
          </div>
          {shareURL && (
            <p style={{ fontFamily:"var(--font-mono, monospace)", fontSize:8, color:"var(--text-3)", wordBreak:"break-all", lineHeight:1.6, padding:"7px 10px", borderRadius:6, background:"var(--surface-2)", border:"1px solid var(--border)" }}>{shareURL}</p>
          )}
        </div>
      </div>
    </div>
  );
}
