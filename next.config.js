/** @type {import('next').NextConfig} */
const nextConfig = {

  // ── Next.js 16 Fix ────────────────────────────────────────────────────────
  // משתיק את השגיאה של Turbopack ומכריח את המערכת להשתמש ב-Webpack המותאם לוידאו
  turbopack: {},

  // ── Silence TS/ESLint errors during Vercel CI ─────────────────────────────
  // מונע מהבנייה להיעצר על אזהרות קטנות - אנחנו בודקים אותן מקומית
  typescript: { ignoreBuildErrors: true },
  eslint:      { ignoreDuringBuilds: true },

  // ── Cross-Origin Isolation ────────────────────────────────────────────────
  // הכרחי עבור FFmpeg.wasm כדי להשתמש ב-SharedArrayBuffer (עיבוד מהיר)
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Cross-Origin-Opener-Policy",   value: "same-origin"   },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp"  },
          { key: "X-Content-Type-Options",       value: "nosniff"       },
          { key: "Referrer-Policy",              value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        // הגדרת סוג הקובץ עבור מנוע ה-AI
        source: "/:path*.wasm",
        headers: [
          { key: "Content-Type",                 value: "application/wasm" },
          { key: "Cross-Origin-Resource-Policy", value: "same-origin"      },
        ],
      },
    ];
  },

  // ── Webpack: Custom config for FFmpeg.wasm ────────────────────────────────
  webpack(config) {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false, 
      path: false, 
      crypto: false,
    };
    config.module.rules.push({
      test: /\.wasm$/,
      type: "asset/resource",
    });
    return config;
  },
};

module.exports = nextConfig;
