import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['lucide-react'],
  serverExternalPackages: ['firebase-admin'],
};

export default nextConfig;
