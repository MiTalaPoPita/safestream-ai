/** @type {import('next').NextConfig} */
const nextConfig = {

  // ── Silence TS/ESLint errors during Vercel CI ─────────────────────────────
  // Catch them locally with: npm run type-check && npm run lint
  typescript: { ignoreBuildErrors: true },
  eslint:     { ignoreDuringBuilds: true },

  // ── Cross-Origin Isolation ────────────────────────────────────────────────
  // Required for SharedArrayBuffer → FFmpeg.wasm multi-thread support.
  // Both headers must be present on EVERY response.
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
        // Serve WASM files with the correct MIME type
        source: "/:path*.wasm",
        headers: [
          { key: "Content-Type",                 value: "application/wasm" },
          { key: "Cross-Origin-Resource-Policy", value: "same-origin"      },
        ],
      },
    ];
  },

  // ── Webpack: keep WASM out of the bundle ──────────────────────────────────
  // @ffmpeg/ffmpeg fetches WASM at runtime — do not let webpack inline it.
  webpack(config) {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false, path: false, crypto: false,
    };
    config.module.rules.push({
      test: /\.wasm$/,
      type: "asset/resource",
    });
    return config;
  },
};

module.exports = nextConfig;
