// lib/safeShare.ts
// Generates and parses Safe-Share deep-links.
// Works in both Server Components and Client Components.

export interface ShareResult {
  shareURL: string;
  isLocal:  boolean;
  note:     string | null;
}

/**
 * generateSafeShareURL
 * Encodes a video source URL into a Safe-Share deep-link.
 *
 * Schema: /player?src=<base64url>&protection=1&ref=share&t=<unix>
 *
 * base64url = RFC 4648 §5 (no padding, '-' and '_' instead of '+' and '/')
 */
export function generateSafeShareURL(
  source: File | string,
  opts: { baseURL?: string; note?: string } = {}
): ShareResult {
  const base =
    opts.baseURL ??
    (typeof window !== "undefined" ? window.location.origin : "https://safestream.ai");

  const isLocal =
    source instanceof File ||
    (typeof source === "string" &&
      (source.startsWith("blob:") || source.startsWith("data:")));

  if (isLocal) {
    return {
      shareURL: `${base}/player?protection=1&mode=upload&ref=share`,
      isLocal:  true,
      note: "Local files cannot be shared by URL. Export first, then share the downloaded file.",
    };
  }

  const encoded = btoa(encodeURIComponent(source as string))
    .replace(/=+$/, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  const ts  = Math.floor(Date.now() / 1000);
  const nqs = opts.note ? `&note=${encodeURIComponent(opts.note)}` : "";

  return {
    shareURL: `${base}/player?src=${encoded}&protection=1&ref=share&t=${ts}${nqs}`,
    isLocal:  false,
    note:     null,
  };
}

/** Decode a Safe-Share URL — safe to call server-side. */
export function parseSafeShareURL(urlString: string): {
  src: string | null;
  protectionOn: boolean;
  ref: string;
} {
  try {
    const url  = new URL(urlString);
    const b64  = url.searchParams.get("src");
    let src: string | null = null;
    if (b64) {
      const padded = b64.replace(/-/g, "+").replace(/_/g, "/");
      const pad    = padded.length % 4 ? "=".repeat(4 - (padded.length % 4)) : "";
      src = decodeURIComponent(atob(padded + pad));
    }
    return {
      src,
      protectionOn: url.searchParams.get("protection") !== "0",
      ref:          url.searchParams.get("ref") ?? "direct",
    };
  } catch {
    return { src: null, protectionOn: true, ref: "direct" };
  }
}

/** Clipboard helper with execCommand fallback. */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard) { await navigator.clipboard.writeText(text); return true; }
    const ta = document.createElement("textarea");
    ta.value = text; ta.style.cssText = "position:fixed;opacity:0";
    document.body.appendChild(ta); ta.focus(); ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch { return false; }
}
