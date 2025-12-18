import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // Configuration pour le rendu côté client
  serverExternalPackages: ['@prisma/client'],
  
  // Configuration des pages
  async rewrites() {
    return [
      // Rediriger les pages vers des versions client
      {
        source: '/login',
        destination: '/login',
      },
      {
        source: '/register',
        destination: '/register',
      },
      {
        source: '/profile',
        destination: '/profile',
      },
    ];
  },
};

export default nextConfig;
