import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuration pour le rendu côté client
  experimental: {
    // Désactiver le SSR pour certaines pages
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  
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
