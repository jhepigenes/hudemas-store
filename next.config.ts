import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.hudemas.ro',
      },
      {
        protocol: 'https',
        hostname: 'hudemas.ro',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'msepwdbzrzqotapgesnd.supabase.co',
      },
    ],
  },
};

export default nextConfig;