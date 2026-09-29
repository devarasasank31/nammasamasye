import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production';

// Content-Security-Policy — the app's own firewall against XSS and data
// exfiltration. Sources are limited to what the code actually loads:
//   - self            : our JS, CSS, fonts and API
//   - map tiles/geocoding (LocationPicker + StaticMap)
//   - Supabase storage/realtime, and the two AI providers used server-side
const cspDirectives = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  `script-src 'self' 'unsafe-inline'${isProd ? '' : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://tile.openstreetmap.org https://*.tile.openstreetmap.org https://server.arcgisonline.com https://*.supabase.co",
  "font-src 'self' data:",
  `connect-src 'self' https://nominatim.openstreetmap.org https://photon.komoot.io https://*.supabase.co wss://*.supabase.co https://api.openai.com https://generativelanguage.googleapis.com${isProd ? '' : ' ws://localhost:* wss://localhost:*'}`,
  "media-src 'self' blob: data:",
  "worker-src 'self' blob:",
  "frame-src 'self'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  ...(isProd ? ['upgrade-insecure-requests'] : []),
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: cspDirectives },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-XSS-Protection', value: '0' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
  { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(self), geolocation=(self), payment=(), usb=(), browsing-topics=()',
  },
  ...(isProd
    ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }]
    : []),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      // Heritage photos never change: let the CDN keep them for a year.
      {
        source: '/heritage/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      // Incident data must never be cached in a shared cache.
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store' },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
      // Landing page: edge-cached for a minute, revalidated in the background
      // so a traffic spike serves from the CDN instead of the origin.
      {
        source: '/',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=0, s-maxage=60, stale-while-revalidate=300' }],
      },
    ];
  },
};

export default nextConfig;
