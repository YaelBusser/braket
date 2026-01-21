import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // Configuration pour le rendu côté client
  serverExternalPackages: ['@prisma/client'],
  
  // Configuration des images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.discordapp.com',
      },
      {
        protocol: 'https',
        hostname: '**.discordapp.com',
      },
      // Domaines pour les images du seed (équipes et joueurs LoL)
      {
        protocol: 'https',
        hostname: 'ih1.redbubble.net',
      },
      {
        protocol: 'https',
        hostname: 'mir-s3-cdn-cf.behance.net',
      },
      {
        protocol: 'https',
        hostname: 'wimg.mk.co.kr',
      },
      {
        protocol: 'https',
        hostname: 'pbs.twimg.com',
      },
      {
        protocol: 'https',
        hostname: 'liquipedia.net',
      },
      {
        protocol: 'https',
        hostname: 'static-cdn.jtvnw.net',
      },
      {
        protocol: 'https',
        hostname: 'www.eclypsia.com',
      },
      {
        protocol: 'https',
        hostname: 'geng.gg',
      },
      {
        protocol: 'https',
        hostname: 'encrypted-tbn0.gstatic.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.dribbble.com',
      },
      {
        protocol: 'https',
        hostname: 'quberten.com',
      },
      {
        protocol: 'https',
        hostname: 'www.lequipe.fr',
      },
      {
        protocol: 'https',
        hostname: 'prod.assets.earlygamecdn.com',
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
      },
      {
        protocol: 'https',
        hostname: 'esportbet.com',
      },
      {
        protocol: 'https',
        hostname: 'storage.ensigame.com',
      },
      {
        protocol: 'https',
        hostname: 'i.pinimg.com',
      },
      {
        protocol: 'https',
        hostname: '**.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '**.wikia.nocookie.net',
      },
      {
        protocol: 'https',
        hostname: 's.yimg.com',
      },
      {
        protocol: 'https',
        hostname: 'media.trackingthepros.com',
      },
      {
        protocol: 'https',
        hostname: 'g2esports.com',
      },
      {
        protocol: 'https',
        hostname: 'img.redbull.com',
      },
      {
        protocol: 'https',
        hostname: 'esportstalk.com',
      },
      {
        protocol: 'https',
        hostname: 'media.altchar.com',
      },
      {
        protocol: 'https',
        hostname: 'fnatic.com',
      },
      {
        protocol: 'https',
        hostname: 'esportsinsider.com',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      },
      {
        protocol: 'https',
        hostname: '**.fbcdn.net',
      },
      {
        protocol: 'https',
        hostname: 'cdn.uc.assets.prezly.com',
      },
      {
        protocol: 'https',
        hostname: 'assets.tiltify.com',
      },
      {
        protocol: 'https',
        hostname: 'nexus.leagueoflegends.com',
      },
      {
        protocol: 'https',
        hostname: 'estnn.com',
      },
      {
        protocol: 'https',
        hostname: 'esports.gg',
      },
      {
        protocol: 'https',
        hostname: 'lcsprofiles.com',
      },
      {
        protocol: 'https',
        hostname: 'fr.egw.news',
      },
      {
        protocol: 'https',
        hostname: 'cloud9.gg',
      },
      {
        protocol: 'https',
        hostname: 'static.invenglobal.com',
      },
      {
        protocol: 'https',
        hostname: 'team-detonation.net',
      },
      {
        protocol: 'https',
        hostname: 'noticias.maisesports.com.br',
      },
      {
        protocol: 'https',
        hostname: 'static-esports.ubisoft.com',
      },
      {
        protocol: 'https',
        hostname: 'e.sport.fr',
      },
      {
        protocol: 'https',
        hostname: 'esports-news.co.uk',
      },
      {
        protocol: 'https',
        hostname: 'admin.esports.gg',
      },
      {
        protocol: 'https',
        hostname: 'stat1-mlycdn.bmyy520.com',
      },
      {
        protocol: 'https',
        hostname: 'a3.espncdn.com',
      },
      {
        protocol: 'https',
        hostname: 'images.seeklogo.com',
      },
    ],
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
