import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.evanluebbert.com" }],
        destination: "https://evanluebbert.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
