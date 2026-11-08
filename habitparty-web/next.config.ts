import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  cacheLife: {
    static: {
      stale: 300,
      revalidate: 60 * 60 * 24 * 30, // 30 dias
      expire: 60 * 60 * 24 * 365, // 1 ano
    },
    catalog: {
      stale: 300, // 5 min no Router Cache do cliente
      revalidate: 300,
      expire: 3600,
    },
    private30: {
      stale: 180, // 3 min no Router Cache do cliente (mutações invalidam na hora via updateTag)
      revalidate: 180,
      expire: 600,
    },
  },
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/assets/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
