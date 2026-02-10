/** @type {import('next').NextConfig} */
const nextConfig = {
  // Treat Supabase packages as external — do not bundle them into each route's
  // serverless function. They are required at runtime from node_modules instead,
  // which avoids duplicating the module across every function bundle.
  serverExternalPackages: [
    '@supabase/supabase-js',
    '@supabase/ssr',
    '@supabase/realtime-js',
  ],

  // NOTE: in Next.js 15 this key lives at root level, NOT inside experimental.
  // Exclude files that are never needed inside serverless functions at runtime:
  // - @next/swc-* : platform-specific SWC compiler binaries (100-150 MB each!)
  //   On Linux/Vercel, @next/swc-linux-x64-gnu is installed and can end up traced.
  // - api/**      : Python FastAPI code — irrelevant to JS functions
  // - .venv/**    : local Python virtual env
  // - webpack/**  : build-time only
  // Force-include Next.js compiled OpenTelemetry (required at runtime by tracer.js).
  // In Next.js 15.5+ the file tracer doesn't always pick this up automatically.
  outputFileTracingIncludes: {
    '*': ['./node_modules/next/dist/compiled/@opentelemetry/**/*'],
  },

  outputFileTracingExcludes: {
    '*': [
      'node_modules/@next/swc-*/**',
      'node_modules/@swc/**',
      'node_modules/webpack/**',
      '.git/**',
      'api/**',
      '.venv/**',
      'venv/**',
    ],
  },
}

module.exports = nextConfig
