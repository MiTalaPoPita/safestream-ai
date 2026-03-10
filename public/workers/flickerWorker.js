/**
 * public/workers/flickerWorker.js
 * ITU-R BT.1702 photosensitive flash detection engine.
 * Loaded via: new Worker('/workers/flickerWorker.js')
 *
 * IN:  { pixels: Uint8ClampedArray, timestamp: number }  — Transferable
 * OUT: FrameResult object (see bottom of file for shape)
 */

// ── ITU-R BT.1702 constants ──────────────────────────────────────────────
const MAX_HZ         = 3;     // max allowed flashes per second
const DELTA_THRESH   = 0.10;  // 10% relative luma change = potential flash
const WINDOW_MS      = 1000;  // rolling analysis window
const LUMA_R         = 0.2126;
const LUMA_G         = 0.7152;
const LUMA_B         = 0.0722;
const STRIDE         = 4;     // sample every 4th pixel (~60fps capable)

// ── State ────────────────────────────────────────────────────────────────
let prevLum       = null;
let lastDir       = null;   // 'R' | 'F' (rise / fall)
let flashTs       = [];     // timestamps of completed flash pairs (ms)
let frames        = 0;
let shielded      = 0;
let dangers       = 0;

// ── BT.709 linearised mean luminance ────────────────────────────────────
function luma(px) {
  let sum = 0, n = 0;
  for (let i = 0; i < px.length; i += STRIDE * 4) {
    const r = px[i]   / 255, g = px[i+1] / 255, b = px[i+2] / 255;
    const rl = r <= .04045 ? r/12.92 : Math.pow((r+.055)/1.055, 2.4);
    const gl = g <= .04045 ? g/12.92 : Math.pow((g+.055)/1.055, 2.4);
    const bl = b <= .04045 ? b/12.92 : Math.pow((b+.055)/1.055, 2.4);
    sum += LUMA_R*rl + LUMA_G*gl + LUMA_B*bl;
    n++;
  }
  return n > 0 ? sum / n : 0;
}

// ── Main ─────────────────────────────────────────────────────────────────
self.onmessage = function ({ data: { pixels, timestamp } }) {
  frames++;
  const cur = luma(pixels);

  if (prevLum === null) {
    prevLum = cur;
    self.postMessage({ riskLevel:"SAFE", filterIntensity:0, flashHz:0,
      currentLuminance:cur, luminanceDelta:0, relativeChange:0,
      shouldFilter:false, isUnsafe:false, frames, shielded, dangers });
    return;
  }

  // Flash transition
  const delta   = cur - prevLum;
  const absDelta= Math.abs(delta);
  const rel     = absDelta / Math.max(prevLum, 0.05);
  const isFlash = rel >= DELTA_THRESH;
  const dir     = delta >= 0 ? "R" : "F";

  if (isFlash) {
    if (lastDir && lastDir !== dir) flashTs.push(timestamp); // completed pair
    lastDir = dir;
  }

  // Evict outside window
  const cutoff = timestamp - WINDOW_MS;
  flashTs = flashTs.filter(t => t > cutoff);
  const hz = flashTs.length;

  // Risk + filter intensity
  let risk = "SAFE", fi = 0;
  if      (hz >= MAX_HZ) { risk = "DANGER";  fi = Math.min(1, .35 + (hz - MAX_HZ) * .2); }
  else if (hz >= 1.5)    { risk = "CAUTION"; fi = .18 + (hz - 1.5) * .12; }

  const unsafe = risk !== "SAFE";
  if (risk === "DANGER") dangers++;
  if (unsafe) shielded++;
  prevLum = cur;

  self.postMessage({
    riskLevel: risk, filterIntensity: fi, flashHz: hz,
    currentLuminance: cur, luminanceDelta: absDelta, relativeChange: rel,
    shouldFilter: unsafe, isUnsafe: unsafe,
    frames, shielded, dangers,
  });
};
