"use client";

// components/SafetyDashboard.tsx
import type { FlickerResult } from "@/lib/useFlickerDetector";

interface Props {
  result:   FlickerResult;
  visible:  boolean;
  onToggle: () => void;
}

interface Meter { label:string; value:string; pct:number; color:string; dangerAt?:number; cautionAt?:number; }
interface Stat  { label:string; value:number; warn?:boolean; }

const META: Record<string, { color:string; glow:string; icon:string; label:string }> = {
  SAFE:    { color:"#10b981", glow:"rgba(16,185,129,.5)",  icon:"◈", label:"Protected" },
  CAUTION: { color:"#f59e0b", glow:"rgba(245,158,11,.5)",  icon:"◉", label:"Caution"   },
  DANGER:  { color:"#ef4444", glow:"rgba(239,68,68,.6)",   icon:"⬡", label:"Filtering"  },
};

export function SafetyDashboard({ result, visible, onToggle }: Props) {
  const { riskLevel, flashHz, currentLuminance, filterIntensity, frames, shielded, dangers } = result;
  const m   = META[riskLevel] ?? META.SAFE;
  const unsafe = riskLevel !== "SAFE";

  const meters: Meter[] = [
    { label:"FLASH FREQ", value:`${flashHz.toFixed(2)} Hz`,               pct: Math.min((flashHz/6)*100,100), color: flashHz>=3?"#ef4444":flashHz>=1.5?"#f59e0b":"#10b981", dangerAt:(3/6)*100, cautionAt:(1.5/6)*100 },
    { label:"LUMINANCE",  value:`${(currentLuminance*100).toFixed(1)}%`,  pct: currentLuminance*100,         color:"#38bdf8" },
    { label:"FILTER STR", value: filterIntensity>0 ? `${Math.round(filterIntensity*100)}%` : "OFF", pct: filterIntensity*100, color: filterIntensity>0?m.color:"#1e2d3d" },
  ];

  const stats: Stat[] = [
    { label:"FRAMES",   value: frames   },
    { label:"SHIELDED", value: shielded },
    { label:"EVENTS",   value: dangers, warn: dangers>0 },
  ];

  return (
    <div style={{ position:"absolute", top:14, right:14, zIndex:50, display:"flex", flexDirection:"column", alignItems:"flex-end", gap:7 }}>
      {/* Toggle pill */}
      <button onClick={onToggle} style={{ display:"flex", alignItems:"center", gap:7, padding:"5px 11px 5px 9px", background:"rgba(5,8,13,.85)", border:`1px solid ${m.color}55`, borderRadius:100, cursor:"pointer", backdropFilter:"blur(12px)", boxShadow: visible?`0 0 14px ${m.glow}`:"none", transition:"all 280ms ease" }}>
        <span style={{ width:6, height:6, borderRadius:"50%", background:m.color, boxShadow:`0 0 5px ${m.color}`, animation: unsafe?"dot-live 1.1s ease-in-out infinite":"none", flexShrink:0 }} />
        <span style={{ fontFamily:"var(--font-mono, monospace)", fontSize:9.5, fontWeight:600, letterSpacing:".11em", color:m.color, textTransform:"uppercase" }}>{m.label}</span>
        <span style={{ fontFamily:"var(--font-mono, monospace)", fontSize:9.5, color:"#3d5166", marginLeft:2 }}>{flashHz.toFixed(1)} Hz</span>
        <span style={{ color:"#1e2d3d", fontSize:9, marginLeft:3 }}>{visible?"▴":"▾"}</span>
      </button>

      {/* Expandable panel */}
      <div style={{ width:218, background:"rgba(4,7,12,.9)", border:"1px solid rgba(255,255,255,.07)", borderRadius:11, backdropFilter:"blur(20px)", overflow:"hidden", maxHeight: visible?380:0, opacity: visible?1:0, transition:"max-height 360ms cubic-bezier(.4,0,.2,1), opacity 260ms ease" }}>
        {/* Header */}
        <div style={{ padding:"9px 13px 7px", borderBottom:"1px solid rgba(255,255,255,.05)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <span style={{ fontFamily:"var(--font-mono, monospace)", fontSize:8.5, letterSpacing:".17em", color:"#253340", textTransform:"uppercase" }}>Shield HUD</span>
          <span style={{ fontFamily:"var(--font-mono, monospace)", fontSize:8.5, color:m.color }}>{m.icon} {riskLevel}</span>
        </div>

        {/* Meters */}
        <div style={{ padding:"11px 13px", display:"flex", flexDirection:"column", gap:9 }}>
          {meters.map(({ label, value, pct, color, dangerAt, cautionAt }) => (
            <div key={label}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                <span style={{ fontFamily:"var(--font-mono, monospace)", fontSize:7.5, letterSpacing:".13em", color:"#253340" }}>{label}</span>
                <span style={{ fontFamily:"var(--font-mono, monospace)", fontSize:8.5, fontWeight:600, color }}>{value}</span>
              </div>
              <div style={{ height:2, background:"rgba(255,255,255,.06)", borderRadius:2, position:"relative", overflow:"hidden" }}>
                {dangerAt  && <div style={{ position:"absolute", left:`${dangerAt}%`,  top:0, bottom:0, width:1, background:"rgba(239,68,68,.4)" }} />}
                {cautionAt && <div style={{ position:"absolute", left:`${cautionAt}%`, top:0, bottom:0, width:1, background:"rgba(245,158,11,.3)" }} />}
                <div style={{ height:"100%", borderRadius:2, width:`${Math.min(pct,100)}%`, background:color, transition:"width 100ms ease-out, background 180ms ease" }} />
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div style={{ padding:"7px 13px 9px", borderTop:"1px solid rgba(255,255,255,.05)", display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:7 }}>
          {stats.map(({ label, value, warn }) => (
            <div key={label} style={{ textAlign:"center" }}>
              <div style={{ fontFamily:"var(--font-mono, monospace)", fontSize:13, fontWeight:700, color: warn?"#ef4444":"#a0b4c8", lineHeight:1 }}>{value}</div>
              <div style={{ fontFamily:"var(--font-mono, monospace)", fontSize:6.5, letterSpacing:".13em", color:"#1e2d3d", marginTop:3, textTransform:"uppercase" }}>{label}</div>
            </div>
          ))}
        </div>

        <div style={{ margin:"0 13px 10px", padding:"4px 8px", background:"rgba(16,185,129,.05)", border:"1px solid rgba(16,185,129,.12)", borderRadius:5, textAlign:"center" }}>
          <span style={{ fontFamily:"var(--font-mono, monospace)", fontSize:7, letterSpacing:".11em", color:"#0d5a3a" }}>ITU-R BT.1702 · EDGE · ZERO UPLOAD</span>
        </div>
      </div>
    </div>
  );
}
