import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  transpilePackages: [
    '@lms/shared-ui',
    '@lms/shared-auth',
    '@lms/block-registry',
    '@lms/shared-schemas',
  ],
  turbopack: {
    root: path.resolve(__dirname, '../..'),
  },
};

export default nextConfig;
