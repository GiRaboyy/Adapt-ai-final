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

  experimental: {
    // Exclude directories that are never needed inside Next.js serverless functions:
    // - api/** is Python code, irrelevant to JS functions
    // - .venv/** / venv/** are local Python virtual envs
    // - build tooling (@swc, webpack) is only needed at build time
    outputFileTracingExcludes: {
      '*': [
        'node_modules/@swc/**',
        'node_modules/webpack/**',
        '.git/**',
        'api/**',
        '.venv/**',
        'venv/**',
      ],
    },
  },
}

module.exports = nextConfig
