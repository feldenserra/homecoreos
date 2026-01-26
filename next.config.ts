import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  serverExternalPackages: ["@prisma/client"],
  transpilePackages: ['@tabler/icons-react'],
  reactCompiler: true,
};

export default nextConfig;
