import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const apiDestination = process.env.NEXT_PUBLIC_API_URL
      ? `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`
      : "http://127.0.0.1:8000/api/:path*";

    return [
      {
        source: "/api/:path*",
        destination: apiDestination,
      },
    ];
  },
};

export default nextConfig;
