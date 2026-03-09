/** @type {import('next').NextConfig} */
const nextConfig = {
  // L3-FIX: Production hardening
  poweredByHeader: false,    // Remove X-Powered-By header (security best practice)
  reactStrictMode: true,     // Enable strict mode for catching common bugs

  // L6-FIX: Security headers — enterprise hardening
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
