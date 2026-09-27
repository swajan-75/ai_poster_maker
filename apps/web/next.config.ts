import type { NextConfig } from 'next';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

const nextConfig: NextConfig = {
  // Compile monorepo workspace packages from source (needed for Vercel builds)
  transpilePackages: ['@poster/shared'],

  // Same-origin proxy → httpOnly auth cookie is first-party on the web domain.
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${API_URL}/api/:path*` }];
  },
  poweredByHeader: false,
};

export default nextConfig;
