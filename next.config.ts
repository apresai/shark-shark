import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // OpenNext handles deployment to AWS Lambda
  experimental: {
    // Stops FileSystemCache writes to read-only /var/task on Lambda (OpenNext #1232).
    isrFlushToDisk: false,
  },
};

export default nextConfig;
