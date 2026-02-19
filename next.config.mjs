/** @type {import('next').NextConfig} */
const nextConfig = {
  // L3-FIX: Production hardening
  poweredByHeader: false,    // Remove X-Powered-By header (security best practice)
  reactStrictMode: true,     // Enable strict mode for catching common bugs
};

export default nextConfig;
