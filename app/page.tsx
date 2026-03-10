"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { generateSafeShareURL } from "@/lib/safeShare";

/* ─── Before / After drag comparator ───────────────────────────────────── */
function BeforeAfter() {
  const [x, setX]           = useState(50);
  const [drag, setDrag]     = useState(false);
  const ref                  = useRef<HTMLDivElement>(null);

  const move = useCallback((cx: number) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    setX(Math.max(5, Math.min(95, ((cx - r.left) / r.width) * 100)));
  }, []);

  useEffect(() => {
    if (!drag) return;
    const mm = (e: MouseEvent | TouchEvent) =>
      move("touches" in e ? e.touches[0].clientX : e.clientX);
    const mu = () => setDrag(false);
    window.addEventListener("mousemove", mm as EventListener);
    window.addEventListener("mouseup", mu);
    window.addEventListener("touchmove", mm as EventListener, { passive: true });
    window.addEventListener("touchend", mu);
    return () => {
      window.removeEventListener("mousemove", mm as EventListener);
      window.removeEventListener("mouseup", mu);
      window.removeEventListener("touchmove", mm as EventListener);
      window.removeEventListener("touchend", mu);
    };
  }, [drag, move]);

  return (
    <div style={{ position:"relative", borderRadius:14, overflow:"hidden",
      boxShadow:"0 32px 80px rgba(0,0,0,.8), 0 0 0 1px rgba(255,255,255,0.06)",
      userSelect:"none" }}>
      <div ref={ref} style={{ position:"relative", paddingTop:"56.25%", cursor:"col-resize" }}
        onMouseDown={e => { setDrag(true); move(e.clientX); }}
        onTouchStart={e => { setDrag(true); move(e.touches[0].clientX); }}
        onMouseMove={e => drag && move(e.clientX)}
      >
        {/* BEFORE */}
        <div style={{ position:"absolute", inset:0,
          background:"radial-gradient(ellipse 60% 50% at 50% 50%, hsl(200,80%,72%) 0%, hsl(220,60%,20%) 45%, #050810 100%)",
          animation:"float 4s ease-in-out infinite" }}>
          <div style={{ position:"absolute", inset:0,
            background:"radial-gradient(ellipse at 50% 50%, rgba(255,255,255,.2) 0%, transparent 55%)",
            animation:"dot-live 0.22s ease-in-out infinite" }} />
          <div style={{ position:"absolute", top:12, left:12, padding:"3px 9px", borderRadius:4,
            background:"rgba(244,63,94,.14)", border:"1px solid rgba(244,63,94,.35)" }}>
            <span style={{ fontFamily:"var(--font-mono, monospace)", fontSize:9, color:"#f43f5e", letterSpacing:".14em" }}>
              ⚠ UNPROTECTED
            </span>
          </div>
          <div style={{ position:"absolute", bottom:12, left:12 }}>
            <p style={{ fontFamily:"var(--font-mono, monospace)", fontSize:22, fontWeight:700, color:"rgba(244,63,94,.9)", lineHeight:1 }}>4.2 Hz</p>
            <p style={{ fontFamily:"var(--font-mono, monospace)", fontSize:8, color:"rgba(244,63,94,.5)", letterSpacing:".12em" }}>FLASH FREQUENCY</p>
          </div>
        </div>

        {/* AFTER */}
        <div style={{ position:"absolute", inset:0,
          clipPath:`inset(0 ${100-x}% 0 0)`,
          transition: drag ? "none" : "clip-path 60ms ease",
          background:"radial-gradient(ellipse 60% 50% at 50% 50%, hsl(200,25%,30%) 0%, hsl(220,15%,10%) 45%, #030507 100%)",
          filter:"brightness(.74) contrast(.72) blur(.8px)" }}>
          <div style={{ position:"absolute", top:12, left:12, padding:"3px 9px", borderRadius:4,
            background:"rgba(16,185,129,.12)", border:"1px solid rgba(16,185,129,.3)" }}>
            <span style={{ fontFamily:"var(--font-mono, monospace)", fontSize:9, color:"#10b981", letterSpacing:".14em" }}>
              🛡 SAFESTREAM ON
            </span>
          </div>
          <div style={{ position:"absolute", bottom:12, left:12 }}>
            <p style={{ fontFamily:"var(--font-mono, monospace)", fontSize:22, fontWeight:700, color:"rgba(16,185,129,.9)", lineHeight:1 }}>0.3 Hz</p>
            <p style={{ fontFamily:"var(--font-mono, monospace)", fontSize:8, color:"rgba(16,185,129,.5)", letterSpacing:".12em" }}>FLASH FREQUENCY</p>
          </div>
        </div>

        {/* Handle */}
        <div style={{ position:"absolute", top:0, bottom:0, left:`${x}%`,
          transform:"translateX(-50%)", width:2, background:"rgba(255,255,255,.55)",
          pointerEvents:"none", transition: drag ? "none" : "left 60ms ease" }}>
          <div style={{ position:"absolute", top:"50%", left:"50%",
            transform:"translate(-50%,-50%)",
            width:32, height:32, borderRadius:"50%",
            background:"rgba(6,10,16,.9)", border:"2px solid rgba(255,255,255,.4)",
            display:"flex", alignItems:"center", justifyContent:"center",
            boxShadow:"0 4px 20px rgba(0,0,0,.6)", fontSize:13 }}>⇔</div>
        </div>
      </div>
      <div style={{ position:"absolute", bottom:12, right:12, padding:"3px 10px", borderRadius:4,
        background:"rgba(0,0,0,.5)", border:"1px solid rgba(255,255,255,.07)" }}>
        <span style={{ fontFamily:"var(--font-mono, monospace)", fontSize:8, color:"rgba(255,255,255,.28)", letterSpacing:".12em" }}>
          ← DRAG TO COMPARE →
        </span>
      </div>
    </div>
  );
}

/* ─── Animated counter ──────────────────────────────────────────────────── */
function Stat({ value, suffix = "", prefix = "", label }: { value:number; suffix?:string; prefix?:string; label:string }) {
  const [n, setN]         = useState(0);
  const [on, setOn]       = useState(false);
  const ref               = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting && !on) setOn(true); }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [on]);

  useEffect(() => {
    if (!on) return;
    let s: number | null = null;
    const dur = 1300;
    const step = (ts: number) => {
      if (!s) s = ts;
      const p = Math.min((ts - s) / dur, 1);
      setN(Math.round((1 - Math.pow(1 - p, 3)) * value));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [on, value]);

  return (
    <div ref={ref} style={{ textAlign:"center" }}>
      <p className="shimmer" style={{ fontFamily:"var(--font-display, Syne, sans-serif)", fontSize:44, fontWeight:900, lineHeight:1, letterSpacing:"-.02em" }}>
        {prefix}{n.toLocaleString()}{suffix}
      </p>
      <p style={{ fontFamily:"var(--font-mono, monospace)", fontSize:9.5, color:"var(--t3)", letterSpacing:".16em", marginTop:6, textTransform:"uppercase" }}>{label}</p>
    </div>
  );
}

/* ─── Feature card ──────────────────────────────────────────────────────── */
function FeatureCard({ icon, title, body, accent, delay, tag }:
  { icon:string; title:string; body:string; accent:string; delay:string; tag?:string }) {
  const el = useRef<HTMLDivElement>(null);
  return (
    <div ref={el} className={`u-fade-up glass ${delay}`}
      style={{ borderRadius:12, padding:"26px 22px", transition:"border-color 280ms, transform 280ms, box-shadow 280ms" }}
      onMouseEnter={() => { if (!el.current) return; el.current.style.borderColor=`${accent}35`; el.current.style.transform="translateY(-4px)"; el.current.style.boxShadow=`0 20px 50px rgba(0,0,0,.5), 0 0 0 1px ${accent}20`; }}
      onMouseLeave={() => { if (!el.current) return; el.current.style.borderColor="var(--border)"; el.current.style.transform="translateY(0)"; el.current.style.boxShadow="none"; }}
    >
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:14 }}>
        <div style={{ width:42, height:42, borderRadius:10, background:`${accent}10`, border:`1px solid ${accent}22`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>{icon}</div>
        {tag && <span style={{ fontFamily:"var(--font-mono, monospace)", fontSize:7.5, letterSpacing:".14em", textTransform:"uppercase", padding:"3px 8px", borderRadius:3, background:`${accent}10`, color:accent, border:`1px solid ${accent}22` }}>{tag}</span>}
      </div>
      <h3 style={{ fontFamily:"var(--font-display, Syne, sans-serif)", fontSize:15, fontWeight:700, color:"var(--t1)", marginBottom:8 }}>{title}</h3>
      <p  style={{ fontFamily:"var(--font-mono, monospace)", fontSize:10, color:"var(--t3)", lineHeight:1.85, letterSpacing:".04em" }}>{body}</p>
    </div>
  );
}

/* ─── MAIN PAGE ─────────────────────────────────────────────────────────── */
export default function LandingPage() {
  const [shareIn,  setShareIn]  = useState("");
  const [shareURL, setShareURL] = useState("");
  const [copied,   setCopied]   = useState(false);

  const doGenerate = () => {
    const url = shareIn.trim() || "https://example.com/sample.mp4";
    setShareURL(generateSafeShareURL(url).shareURL);
  };

  const doCopy = async () => {
    await navigator.clipboard?.writeText(shareURL).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2400);
  };

  return (
    <div style={{ background:"var(--obs)", minHeight:"100vh", overflowX:"hidden" }}>

      {/* Ambient blobs */}
      <div aria-hidden style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0, overflow:"hidden" }}>
        <div style={{ position:"absolute", top:"-18%", left:"28%", width:640, height:640, borderRadius:"50%", background:"radial-gradient(circle, rgba(16,185,129,.04) 0%, transparent 70%)", filter:"blur(40px)" }} />
        <div style={{ position:"absolute", top:"42%", right:"-8%",  width:500, height:500, borderRadius:"50%", background:"radial-gradient(circle, rgba(56,189,248,.03) 0%, transparent 70%)", filter:"blur(40px)" }} />
      </div>

      <div style={{ position:"relative", zIndex:1 }}>

        {/* ── NAV ── */}
        <nav style={{ position:"sticky", top:0, zIndex:200, background:"rgba(2,4,6,.9)", backdropFilter:"blur(20px)", borderBottom:"1px solid var(--border)", padding:"0 40px", height:54, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:"var(--em)", boxShadow:"0 0 8px var(--em)", animation:"dot-live 2.5s ease-in-out infinite" }} />
            <span style={{ fontFamily:"var(--font-display, Syne, sans-serif)", fontSize:17, fontWeight:800, color:"#fff", letterSpacing:".03em" }}>
              Safe<span style={{ color:"var(--em)" }}>Stream</span><span style={{ color:"var(--s3)" }}>AI</span>
            </span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:24 }}>
            {["Technology","API"].map(l => (
              <span key={l} style={{ fontFamily:"var(--font-mono, monospace)", fontSize:9.5, color:"var(--t3)", letterSpacing:".12em", textTransform:"uppercase", cursor:"pointer" }}>{l}</span>
            ))}
            <Link href="/player">
              <button className="btn-primary" style={{ padding:"8px 18px", borderRadius:8, fontSize:9 }}>Open App →</button>
            </Link>
          </div>
        </nav>

        {/* ── HERO ── */}
        <section style={{ maxWidth:1060, margin:"0 auto", padding:"88px 32px 72px", textAlign:"center" }}>

          <div className="u-fade-up" style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"6px 16px", borderRadius:100, background:"rgba(16,185,129,.06)", border:"1px solid rgba(16,185,129,.18)", marginBottom:28 }}>
            <div style={{ width:5, height:5, borderRadius:"50%", background:"var(--em)", animation:"dot-live 1.5s ease-in-out infinite" }} />
            <span style={{ fontFamily:"var(--font-mono, monospace)", fontSize:9.5, color:"var(--em)", letterSpacing:".15em", textTransform:"uppercase" }}>
              ITU-R BT.1702 Compliant · Medical-Grade Accuracy
            </span>
          </div>

          <h1 className="u-fade-up d1" style={{ fontFamily:"var(--font-display, Syne, sans-serif)", fontSize:"clamp(38px,6vw,70px)", fontWeight:900, lineHeight:1.1, letterSpacing:"-.03em", color:"var(--t1)", marginBottom:20 }}>
            Watch any video.<br />
            <span className="shimmer">Without the danger.</span>
          </h1>

          <p className="u-fade-up d2" style={{ fontFamily:"var(--font-mono, monospace)", fontSize:12, color:"var(--t2)", lineHeight:1.9, maxWidth:520, margin:"0 auto 40px", letterSpacing:".04em" }}>
            SafeStream AI detects photosensitive flash events in real-time and applies an adaptive Digital Sunglasses filter — entirely on your device, zero upload, zero latency.
          </p>

          <div className="u-fade-up d3" style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:14, marginBottom:64, flexWrap:"wrap" }}>
            <Link href="/player">
              <button className="btn-primary" style={{ padding:"14px 32px", borderRadius:10, fontSize:10 }}>🛡 Open SafeStream Player</button>
            </Link>
            <button className="btn-ghost" style={{ padding:"14px 24px", borderRadius:10, fontSize:10 }}>↓ Read the Whitepaper</button>
          </div>

          <div className="u-scale-in d4" style={{ maxWidth:780, margin:"0 auto" }}>
            <BeforeAfter />
          </div>
          <p className="u-fade-in d6" style={{ fontFamily:"var(--font-mono, monospace)", fontSize:8.5, color:"var(--t3)", letterSpacing:".12em", marginTop:12 }}>
            LIVE SIMULATION · DRAG THE DIVIDER TO COMPARE
          </p>
        </section>

        {/* ── STATS ── */}
        <section style={{ borderTop:"1px solid var(--border)", borderBottom:"1px solid var(--border)", background:"var(--s1)" }}>
          <div style={{ maxWidth:1060, margin:"0 auto", padding:"56px 32px", display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:32 }}>
            <Stat value={60}  suffix=" fps" label="Real-time analysis"      />
            <Stat value={3}   suffix=" Hz"  label="ITU-R flash limit"  prefix="<" />
            <Stat value={0}   suffix=""     label="Video bytes uploaded"    />
            <Stat value={100} suffix="%"    label="On-device processing"    />
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section style={{ maxWidth:1060, margin:"0 auto", padding:"88px 32px" }}>
          <div className="u-fade-up" style={{ textAlign:"center", marginBottom:50 }}>
            <p style={{ fontFamily:"var(--font-mono, monospace)", fontSize:9, color:"var(--t3)", letterSpacing:".18em", textTransform:"uppercase", marginBottom:12 }}>Core Technology</p>
            <h2 style={{ fontFamily:"var(--font-display, Syne, sans-serif)", fontSize:"clamp(24px,4vw,42px)", fontWeight:800, color:"var(--t1)", letterSpacing:"-.02em" }}>
              Built on three <span className="shimmer">uncompromising</span> pillars
            </h2>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14 }}>
            <FeatureCard delay="d1" icon="⚡" accent="#10b981" tag="Privacy First"   title="Zero-Server Processing"   body="Every pixel is analysed locally in a Web Worker. Your video never leaves your browser tab — no server roundtrip, no data retention, by architectural design." />
            <FeatureCard delay="d2" icon="🌐" accent="#38bdf8" tag="Any Source"      title="Universal URL Support"    body="Paste any public video URL — HLS streams, DASH manifests, direct MP4. SafeStream injects protection at the browser level, before frames reach your retinas." />
            <FeatureCard delay="d3" icon="🔬" accent="#a78bfa" tag="ITU-R BT.1702"  title="Medical-Grade Accuracy"   body="BT.709 luma coefficients with rolling-window flash counter follows the exact photosensitive epilepsy thresholds — 3 Hz max, 10% relative Δluminance." />
            <FeatureCard delay="d4" icon="🕶" accent="#f59e0b" tag="Non-Disruptive" title="Digital Sunglasses Filter" body="A CSS backdrop-filter overlay fades in over 300 ms — dimming brightness, reducing contrast and softening edges. Playback never stops or stutters." />
            <FeatureCard delay="d5" icon="📦" accent="#f43f5e" tag="FFmpeg.wasm"    title="Safe Export Engine"       body="Bake the Digital Sunglasses filter permanently into a new MP4 using FFmpeg compiled to WebAssembly. Share a version that's safe before the player even loads." />
            <FeatureCard delay="d6" icon="🔗" accent="#10b981" tag="Deep Links"     title="Safe-Share Protocol"      body="Generate a signed deep-link that opens the player with your video and Protection: ON by default. Recipients are protected from frame one — zero setup." />
          </div>
        </section>

        {/* ── SAFE-SHARE DEMO ── */}
        <section style={{ borderTop:"1px solid var(--border)", background:"var(--s1)" }}>
          <div style={{ maxWidth:640, margin:"0 auto", padding:"80px 32px", textAlign:"center" }}>
            <div className="u-fade-up">
              <p style={{ fontFamily:"var(--font-mono, monospace)", fontSize:9, color:"var(--t3)", letterSpacing:".18em", textTransform:"uppercase", marginBottom:10 }}>Safe-Share</p>
              <h2 style={{ fontFamily:"var(--font-display, Syne, sans-serif)", fontSize:"clamp(22px,3.5vw,36px)", fontWeight:800, color:"var(--t1)", letterSpacing:"-.02em", marginBottom:10 }}>One link. Full protection.</h2>
              <p style={{ fontFamily:"var(--font-mono, monospace)", fontSize:10, color:"var(--t3)", lineHeight:1.9, marginBottom:28 }}>Paste any public video URL and generate a Safe-Share link that opens with protection pre-enabled. Recipients are protected from the first frame.</p>
            </div>
            <div className="u-fade-up d2 glass" style={{ borderRadius:12, padding:"22px", textAlign:"left" }}>
              <div style={{ display:"flex", gap:10, marginBottom:10 }}>
                <input value={shareIn} onChange={e => setShareIn(e.target.value)} onKeyDown={e => e.key==="Enter" && doGenerate()}
                  placeholder="https://example.com/video.mp4"
                  style={{ flex:1, padding:"10px 14px", borderRadius:8, background:"var(--s2)", border:"1px solid var(--border)", color:"var(--t1)", fontFamily:"var(--font-mono, monospace)", fontSize:10, outline:"none" }}
                  onFocus={e => (e.target.style.borderColor="rgba(16,185,129,.35)")}
                  onBlur={e  => (e.target.style.borderColor="var(--border)")}
                />
                <button className="btn-primary" onClick={doGenerate} style={{ padding:"10px 18px", borderRadius:8, fontSize:9, whiteSpace:"nowrap" }}>Generate →</button>
              </div>
              {shareURL && (
                <div style={{ animation:"fade-up 280ms ease both" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 12px", borderRadius:7, background:"rgba(16,185,129,.05)", border:"1px solid rgba(16,185,129,.14)", marginBottom:8 }}>
                    <span style={{ fontFamily:"var(--font-mono, monospace)", fontSize:8.5, color:"var(--t3)", flex:1, wordBreak:"break-all", lineHeight:1.6 }}>{shareURL}</span>
                    <button onClick={doCopy} style={{ padding:"4px 10px", borderRadius:5, background:"rgba(16,185,129,.1)", border:"1px solid rgba(16,185,129,.25)", color:"var(--em)", fontFamily:"var(--font-mono, monospace)", fontSize:8.5, cursor:"pointer", whiteSpace:"nowrap", flexShrink:0 }}>
                      {copied ? "✓ Copied" : "⎘ Copy"}
                    </button>
                  </div>
                  <div style={{ display:"flex", gap:7, flexWrap:"wrap" }}>
                    {[["protection","1 (ON)"],["ref","share"],["src","base64url"]].map(([k,v]) => (
                      <div key={k} style={{ padding:"3px 8px", borderRadius:4, background:"var(--s2)", border:"1px solid var(--border)" }}>
                        <span style={{ fontFamily:"var(--font-mono, monospace)", fontSize:7.5, color:"var(--t3)" }}>
                          <span style={{ color:"var(--em)" }}>{k}</span>={v}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section style={{ maxWidth:1060, margin:"0 auto", padding:"88px 32px" }}>
          <div className="u-fade-up" style={{ textAlign:"center", marginBottom:50 }}>
            <h2 style={{ fontFamily:"var(--font-display, Syne, sans-serif)", fontSize:"clamp(22px,3.5vw,38px)", fontWeight:800, color:"var(--t1)", letterSpacing:"-.02em" }}>The pipeline, explained</h2>
          </div>
          {[
            { n:"01", color:"var(--em)",    title:"Frame Capture",        body:"requestVideoFrameCallback() hooks into the browser's native video decode pipeline. Each frame is drawn to an off-screen 320×180 canvas for efficient sub-sampled analysis." },
            { n:"02", color:"var(--sky)",   title:"Luminance Analysis",   body:"BT.709 luma coefficients (0.2126R + 0.7152G + 0.0722B) with sRGB gamma linearisation compute the perceptual mean luminance of each frame inside the Web Worker — zero main-thread blocking." },
            { n:"03", color:"#a78bfa",      title:"ITU Flash Detection",  body:"A rolling 1-second window tracks frame-to-frame Δluminance transitions. Opposing direction pairs (rise→fall or fall→rise) above the 10% relative threshold count as General Flash events." },
            { n:"04", color:"var(--amber)", title:"Risk Score & Filter",  body:"≥ 3 flashes/sec = DANGER. The Digital Sunglasses CSS filter (brightness·contrast·blur) fades in over 300 ms. Intensity scales proportionally — minimal intrusion for mild events." },
          ].map(({ n, color, title, body }, i, arr) => (
            <div key={n} className="u-fade-up" style={{ display:"flex", gap:28, padding:"26px 0", borderBottom: i < arr.length-1 ? "1px solid var(--border)" : "none" }}>
              <div style={{ flexShrink:0, width:52, textAlign:"right", paddingTop:2 }}>
                <span style={{ fontFamily:"var(--font-display, Syne, sans-serif)", fontSize:28, fontWeight:900, color, opacity:.3, letterSpacing:"-.04em" }}>{n}</span>
              </div>
              <div>
                <h3 style={{ fontFamily:"var(--font-display, Syne, sans-serif)", fontSize:16, fontWeight:700, color:"var(--t1)", marginBottom:7 }}>{title}</h3>
                <p  style={{ fontFamily:"var(--font-mono, monospace)", fontSize:10, color:"var(--t3)", lineHeight:1.9 }}>{body}</p>
              </div>
            </div>
          ))}
        </section>

        {/* ── FINAL CTA ── */}
        <section style={{ borderTop:"1px solid var(--border)", background:"var(--s1)" }}>
          <div style={{ maxWidth:580, margin:"0 auto", padding:"96px 32px", textAlign:"center" }}>
            <div className="u-fade-up" style={{ width:68, height:68, borderRadius:18, margin:"0 auto 24px", background:"rgba(16,185,129,.08)", border:"1px solid rgba(16,185,129,.2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:30, animation:"glow-pulse 3s ease-in-out infinite" }}>🛡</div>
            <h2 className="u-fade-up d1" style={{ fontFamily:"var(--font-display, Syne, sans-serif)", fontSize:"clamp(26px,4vw,44px)", fontWeight:900, color:"var(--t1)", letterSpacing:"-.03em", marginBottom:12 }}>Start watching safely.</h2>
            <p className="u-fade-up d2" style={{ fontFamily:"var(--font-mono, monospace)", fontSize:10.5, color:"var(--t3)", lineHeight:1.9, marginBottom:34 }}>No sign-up. No extension. No server. Drop a video file or paste a URL — SafeStream protects you from the first frame.</p>
            <div className="u-fade-up d3">
              <Link href="/player">
                <button className="btn-primary" style={{ padding:"16px 40px", borderRadius:12, fontSize:11 }}>🛡 Open SafeStream AI</button>
              </Link>
            </div>
            <p className="u-fade-up d4" style={{ fontFamily:"var(--font-mono, monospace)", fontSize:8, color:"var(--t3)", letterSpacing:".14em", marginTop:18, textTransform:"uppercase" }}>Free · Open Source · ITU-R BT.1702</p>
          </div>
        </section>

        {/* Footer */}
        <footer style={{ borderTop:"1px solid var(--border)", padding:"22px 40px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <span style={{ fontFamily:"var(--font-display, Syne, sans-serif)", fontSize:13, fontWeight:800, color:"var(--s3)" }}>Safe<span style={{ color:"rgba(16,185,129,.3)" }}>Stream</span>AI</span>
          <span style={{ fontFamily:"var(--font-mono, monospace)", fontSize:8, color:"var(--t3)", letterSpacing:".12em" }}>NEXT.JS 15 · TYPESCRIPT · FFMPEG.WASM · WEB WORKERS · CANVAS API</span>
          <span style={{ fontFamily:"var(--font-mono, monospace)", fontSize:8, color:"var(--t3)" }}>© 2025 SafeStream AI · MIT</span>
        </footer>
      </div>
    </div>
  );
}
