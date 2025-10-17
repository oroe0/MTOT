import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  images: { unoptimized: true },
  // if you’re deploying to a subpath (like username.github.io/repo-name)
  basePath: '/MTOT',
  assetPrefix: '/MTOT/',
};

export default nextConfig;
