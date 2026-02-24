import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    // Use configured API URL, or fall back to the production Render backend
    const apiDestination = process.env.NEXT_PUBLIC_API_URL
      ? `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`
      : "https://lms-api-bkuw.onrender.com/api/:path*";

    return [
      {
        source: "/api/:path*",
        destination: apiDestination,
      },
    ];
  },
};

export default nextConfig;
