import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/applications",
        destination: "/testing/applications",
        permanent: false,
      },
      {
        source: "/applications/:id",
        destination: "/testing/applications/:id",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
