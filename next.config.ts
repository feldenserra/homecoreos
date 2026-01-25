import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  serverExternalPackages: ["@prisma/client"],
  reactCompiler: true,
};

export default nextConfig;
