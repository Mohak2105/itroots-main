import type { NextConfig } from "next";

const nextConfig = {
  experimental: {
    // Keep Next on a single worker-thread path in environments where child_process spawning is blocked.
    cpus: 1,
    workerThreads: true,
    webpackBuildWorker: false,
  },
} as NextConfig;

export default nextConfig;
