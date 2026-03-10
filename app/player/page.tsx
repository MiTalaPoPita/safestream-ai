"use client";

// app/player/page.tsx
import { useState, useRef, useCallback } from "react";
import Link                              from "next/link";
import { useFlickerDetector }            from "@/hooks/useFlickerDetector";
import { DigitalSunglasses }             from "@/components/DigitalSunglasses";
import { SafetyDashboard }               from "@/components/SafetyDashboard";
import { ExportPanel }                   from "@/components/ExportPanel";
import { generateSafeShareURL, copyShareURLToClipboard } from "@/lib/safeShare";

interface Props {
  initialSrc?:        string | null;
  initialProtection?: boolean;
}

const DEMO = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

export default function PlayerPage({ initialSrc = null, initialProtection = true }: Props) {
  const videoRef   = useRef<HTMLVideoElement>(null);
  const hideTimer  = useRef<ReturnType<typeof setTimeout>>(undefined);

  const [src,          setSrc]          = useState<string | null>(initialSrc);
  const [protection,   setProtection]   = useState(initialProtection);
  const [dashOpen,     setDashOpen]     = useState(true);
  const [showExport,   setShowExport]   = useState(false);
  const [playing,      setPlaying]      = useState(false);
  const [duration,     setDuration]     = useState(0);
  const [currentTime,  setCurrentTime]  = useState(0);
  const [volume,       setVolume]       = useState(0.85);
  const [muted,        setMuted]        = useState(false);
  const [ctrlVis,      setCtrlVis]      = useState(true);
  const [urlIn,        setUrlIn]        = useState("");
  const [shareCopied,  setShareCopied]  = useState(false);

  const flicker = useFlickerDetector(videoRef, protection && !!src);

  // Filter params passed to ExportPanel
  const exportParams = {
    brightness: -(flicker.filterIntensity * 0.65) || -0.15,
    contrast:   1 - flicker.filterIntensity * 0.35 || 0.72,
    blur:       flicker.filterIntensity * 3.5 || 1.2,
  };

  const showCtrls = useCallback(() => {
    setCtrlVis(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => { if (playing) setCtrlVis(false); }, 2800);
  }, [playing]);

  const fmt = (s: number) => `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,"0")}`;

  const RISK_COLOR: Record<string, string> = { SAFE:"#10b981", CAUTION:"#f59e0b", DANGER:"#ef4444" };
  const rc = RISK_COLOR[flicker.riskLevel] ?? "#10b981";

  const handleShare = async () => {
    if (!src) return;
    const { shareURL } = generateSafeShareURL(src);
    await copyShareURLToClipboard(shareURL);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2400);
  };

  return (
    <div style={{ minHeight:"100vh", background:"var(--obs)", color:"var(--text-1)", fontFamily:"var(--font-mono, monospace)" }}>

      {/* ── NAV ── */}
      <nav style={{ position:"sticky", top:0, zIndex:200, background:"rgba(2,4,6,.92)", backdropFilter:"blur(20px)", borderBottom:"1px solid var(--border)", padding:"0 32px", height:52, display:"flex", alignItems:"center", gap:14 }}>
        <Link href="/" style={{ display:"flex", alignItems:"center", gap:8, textDecoration:"none" }}>
          <div style={{ width:6, height:6, borderRadius:"50%", background:"var(--emerald)", boxShadow:"0 0 7px var(--emerald)" }} />
          <span style={{ fontFamily:"var(--font-display, Syne, sans-serif)", fontSize:16, fontWeight:800, color:"#fff" }}>
            Safe<span style={{ color:"var(--emerald)" }}>Stream</span><span style={{ color:"var(--surface-3)" }}>AI</span>
          </span>
        </Link>
        <div style={{ flex:1 }} />
        {src && (
          <>
            <button onClick={handleShare} style={{ padding:"5px 13px", borderRadius:6, background:"transparent", border:"1px solid var(--border)", color:"var(--text-3)", fontFamily:"inherit", fontSize:8.5, letterSpacing:".12em", cursor:"pointer" }}>
              {shareCopied ? "✓ Copied" : "⎘ Safe-Share"}
            </button>
            <button className="cta-primary" onClick={() => setShowExport(true)} style={{ padding:"6px 16px", borderRadius:6, fontSize:8.5, marginLeft: 10 }}>
              ↓ Export
            </button>
          </>
        )}
      </nav>

      <main style={{ maxWidth:960, margin:"0 auto", padding:"28px 22px" }}>

        {/* URL / File input */}
        {!src && (
          <div style={{ marginBottom:20, display:"flex", flexDirection:"column", gap:10 }}>
            <div style={{ display:"flex", gap:9 }}>
              <input value={urlIn} onChange={e => setUrlIn(e.target.value)} onKeyDown={e => e.key==="Enter" && urlIn.trim() && setSrc(urlIn.trim())}
                placeholder="Paste video URL (MP4, HLS, DASH)…"
                style={{ flex:1, padding:"11px 14px", borderRadius:8, background:"var(--surface-2)", border:"1px solid var(--border)", color:"var(--text-1)", fontFamily:"inherit", fontSize:11, outline:"none" }}
                onFocus={e=>(e.target.style.borderColor="rgba(16,185,129,.35)")}
                onBlur={e =>(e.target.style.borderColor="var(--border)")}
              />
              <button className="cta-primary" onClick={() => urlIn.trim() && setSrc(urlIn.trim())} style={{ padding:"11px 20px", borderRadius:8, fontSize:9 }}>Load →</button>
            </div>

            <label style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10, padding:"26px 0", border:"1px dashed rgba(255,255,255,.07)", borderRadius:10, cursor:"pointer", color:"var(--text-3)", fontSize:9.5, letterSpacing:".1em", textTransform:"uppercase" }}>
              <input type="file" accept="video/*" style={{ display:"none" }}
                onChange={e => { const f = e.target.files?.[0]; if (f?.type.startsWith("video/")) setSrc(URL.createObjectURL(f)); }} />
              📁  Drop or select a video file  ·  MP4 · MOV · WEBM · MKV
            </label>

            <button onClick={() => setSrc(DEMO)} style={{ alignSelf:"center", padding:"7px 18px", borderRadius:8, background:"rgba(16,185,129,.07)", border:"1px solid rgba(16,185,129,.2)", color:"var(--emerald)", fontFamily:"inherit", fontSize:9, letterSpacing:".12em", cursor:"pointer" }}>
              ▶ Load demo video (Big Buck Bunny)
            </button>
          </div>
        )}

        {/* Player */}
        <div onMouseMove={showCtrls} onMouseLeave={() => playing && setCtrlVis(false)}
          style={{ position:"relative", width:"100%", aspectRatio:"16/9", background:"#020305", borderRadius:12, overflow:"hidden",
            boxShadow:`0 32px 80px rgba(0,0,0,.85), 0 0 0 1px rgba(255,255,255,.04), 0 0 0 1px ${rc}18` }}>

          {src ? (
            <video ref={videoRef} src={src}
              style={{ width:"100%", height:"100%", objectFit:"contain", display:"block" }}
              onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)}
              onTimeUpdate={()=>setCurrentTime(videoRef.current?.currentTime??0)}
              onLoadedMetadata={()=>setDuration(videoRef.current?.duration??0)}
              playsInline crossOrigin="anonymous" />
          ) : (
            <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <div style={{ textAlign:"center", color:"var(--text-3)" }}>
                <div style={{ fontSize:42, marginBottom:10 }}>🛡</div>
                <p style={{ fontSize:10, letterSpacing:".12em" }}>LOAD A VIDEO ABOVE TO BEGIN</p>
              </div>
            </div>
          )}

          {/* Digital Sunglasses */}
          {protection && src && (
            <DigitalSunglasses isUnsafe={flicker.isUnsafe} intensity={flicker.filterIntensity} riskLevel={flicker.riskLevel} />
          )}

          {/* Safety HUD */}
          <SafetyDashboard result={protection ? flicker : { riskLevel:"SAFE", filterIntensity:0, flashHz:0, currentLuminance:0, luminanceDelta:0, relativeChange:0, shouldFilter:false, isUnsafe:false, frameCount:0, filteredCount:0, dangerCount:0 }} visible={dashOpen} onToggle={() => setDashOpen(o=>!o)} />

          {/* Controls */}
          {src && (
            <div style={{ position:"absolute", bottom:0, left:0, right:0, zIndex:40,
              background:"linear-gradient(to top, rgba(0,0,0,.92) 0%, transparent 100%)",
              padding:"36px 18px 14px",
              opacity: ctrlVis?1:0, transition:"opacity 380ms ease", pointerEvents: ctrlVis?"auto":"none" }}>

              {/* Scrub bar */}
              <div onClick={e => { const r=e.currentTarget.getBoundingClientRect(); if(videoRef.current) videoRef.current.currentTime=(e.clientX-r.left)/r.width*duration; }}
                style={{ height:2, background:"rgba(255,255,255,.1)", borderRadius:2, cursor:"pointer", marginBottom:11, position:"relative" }}>
                <div style={{ position:"absolute", left:0, top:0, height:"100%", borderRadius:2,
                  width:`${duration>0?(currentTime/duration)*100:0}%`,
                  background:"linear-gradient(90deg,#10b981,#38bdf8)", transition:"width 180ms linear" }} />
              </div>

              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                {/* Play/Pause */}
                <button onClick={()=>{ const v=videoRef.current; if(v) v.paused?v.play():v.pause(); }}
                  style={{ background:"none", border:"none", color:"rgba(255,255,255,.6)", cursor:"pointer", fontSize:16, lineHeight:1 }}>
                  {playing?"⏸":"▶"}
                </button>

                {/* Volume */}
                <input type="range" min={0} max={1} step={.02} value={muted?0:volume}
                  onChange={e=>{ const v=parseFloat(e.target.value); setVolume(v); setMuted(v===0); if(videoRef.current){ videoRef.current.volume=v; videoRef.current.muted=v===0; } }}
                  style={{ width:56 }} />

                <span style={{ fontSize:9.5, color:"var(--text-3)" }}>{fmt(currentTime)} / {fmt(duration)}</span>
                <div style={{ flex:1 }} />

                {/* Shield toggle */}
                <button onClick={()=>setProtection(p=>!p)} style={{ padding:"4px 10px", borderRadius:100,
                  background: protection?"rgba(16,185,129,.12)":"rgba(255,255,255,.04)",
                  border:`1px solid ${protection?"rgba(16,185,129,.3)":"rgba(255,255,255,.06)"}`,
                  color: protection?"#10b981":"var(--text-3)",
                  fontFamily:"inherit", fontSize:8, letterSpacing:".12em", cursor:"pointer" }}>
                  {protection?"🛡 Protected":"○ Shield off"}
                </button>

                {/* Fullscreen */}
                <button onClick={()=>{ const el=videoRef.current?.closest("div[data-player]") as HTMLElement; if(el) document.fullscreenElement?document.exitFullscreen():el.requestFullscreen(); }}
                  style={{ background:"none", border:"none", color:"rgba(255,255,255,.4)", cursor:"pointer", fontSize:13 }}>⛶</button>
              </div>
            </div>
          )}

          {/* Big play button when paused & loaded */}
          {src && !playing && (
            <div onClick={()=>videoRef.current?.play()}
              style={{ position:"absolute", inset:0, zIndex:30, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
              <div style={{ width:60, height:60, borderRadius:"50%", background:"rgba(4,8,14,.78)", border:"1px solid rgba(16,185,129,.4)", display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(8px)", boxShadow:"0 0 28px rgba(16,185,129,.22)" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="rgba(16,185,129,.9)"><polygon points="6,3 20,12 6,21"/></svg>
              </div>
            </div>
          )}
        </div>

        {src && (
          <div style={{ marginTop:11, display:"flex", justifyContent:"flex-end" }}>
            <button onClick={()=>setSrc(null)} style={{ padding:"6px 13px", borderRadius:6, background:"transparent", border:"1px solid var(--border)", color:"var(--text-3)", fontFamily:"inherit", fontSize:8.5, cursor:"pointer" }}>
              ← Load different video
            </button>
          </div>
        )}
      </main>

      {/* Export modal */}
      {showExport && src && (
        <ExportPanel
          sourceFile={src}
          sourceName={src.split("/").pop()?.replace(/\?.*$/,"") ?? "video.mp4"}
          filterParams={exportParams}
          onClose={()=>setShowExport(false)}
        />
      )}
    </div>
  );
}
