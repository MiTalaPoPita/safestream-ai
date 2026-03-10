"use client";

// components/DigitalSunglasses.tsx
// Pure CSS overlay applied on top of the video wrapper.
// 300ms smooth transition. Never interrupts playback.
// filter params mirror what FFmpeg bakes on export.

interface Props {
  isUnsafe:  boolean;
  intensity: number;   // 0–1
  riskLevel: string;
}

export function DigitalSunglasses({ isUnsafe, intensity, riskLevel }: Props) {
  const brightness = 1 - intensity * 0.65;
  const blurPx     = intensity * 3.5;
  const contrast   = 1 - intensity * 0.35;
  const tint       = intensity * 0.28;

  const filter = isUnsafe
    ? `brightness(${brightness.toFixed(3)}) blur(${blurPx.toFixed(2)}px) contrast(${contrast.toFixed(3)})`
    : "none";

  return (
    <>
      {/* Primary filter layer */}
      <div aria-hidden data-ss="sunglasses" style={{
        position:"absolute", inset:0, pointerEvents:"none", zIndex:20,
        backdropFilter: filter,
        WebkitBackdropFilter: filter,
        opacity: isUnsafe ? 1 : 0,
        transition: "backdrop-filter 300ms cubic-bezier(.4,0,.2,1), opacity 300ms ease",
      }} />

      {/* Deep-blue tint layer */}
      <div aria-hidden style={{
        position:"absolute", inset:0, pointerEvents:"none", zIndex:21,
        background: `rgba(4,10,28,${tint.toFixed(3)})`,
        transition: "background 300ms cubic-bezier(.4,0,.2,1)",
      }} />

      {/* Red vignette pulse on DANGER */}
      {riskLevel === "DANGER" && (
        <div aria-hidden style={{
          position:"absolute", inset:0, pointerEvents:"none", zIndex:22,
          boxShadow: "inset 0 0 80px rgba(220,38,38,0.35)",
          animation: "vignette .8s ease-in-out infinite alternate",
        }} />
      )}
    </>
  );
}
