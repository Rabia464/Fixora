import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== 'production';

// If the UI talks to a separately hosted API, allow fetches to that origin.
function apiOrigin(): string {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url || url.startsWith('/')) return '';
  try {
    return new URL(url).origin;
  } catch {
    return '';
  }
}

/**
 * Content Security Policy. Next.js injects inline bootstrap scripts, so
 * script-src keeps 'unsafe-inline' (moving to nonces needs dynamic rendering
 * of every page). Everything else is locked to this origin, plus Google Fonts.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob:",
  `connect-src 'self' ${apiOrigin()}`.trim(),
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ['upgrade-insecure-requests']),
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
];

const nextConfig: NextConfig = {
  transpilePackages: ['lucide-react'],
  serverExternalPackages: ['firebase-admin'],
  poweredByHeader: false,
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      // API responses carry user data and tokens; never let a cache keep them.
      { source: '/api/:path*', headers: [{ key: 'Cache-Control', value: 'no-store' }] },
    ];
  },
};

export default nextConfig;
