import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@finbooks/shared"],
  output: "standalone",
};

export default nextConfig;
