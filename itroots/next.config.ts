import type { NextConfig } from "next";

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function normalizeProxyOrigin(value?: string) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }

  return trimTrailingSlash(trimmed).replace(/\/api\/v1$/, "");
}

function normalizeProxyApiBase(value?: string) {
  const origin = normalizeProxyOrigin(value);
  if (!origin) {
    return null;
  }

  return `${origin}/api/v1`;
}

function normalizeExternalOrigin(value?: string) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }

  const withoutProtocol = trimTrailingSlash(trimmed).replace(/^https?:\/\//, "");
  return `https://${withoutProtocol}`;
}

const proxyOrigin = normalizeProxyOrigin(
  process.env.API_PROXY_TARGET || process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL,
);
const proxyApiBase = normalizeProxyApiBase(
  process.env.API_PROXY_TARGET || process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL,
);
const jitsiOrigin = normalizeExternalOrigin(process.env.NEXT_PUBLIC_JITSI_DOMAIN);
const permissionsPolicy = jitsiOrigin
  ? [
      `camera=(self "${jitsiOrigin}")`,
      `microphone=(self "${jitsiOrigin}")`,
      `display-capture=(self "${jitsiOrigin}")`,
      `fullscreen=(self "${jitsiOrigin}")`,
    ].join(", ")
  : null;

const nextConfig = {
  experimental: {
    // Keep Next on a single worker-thread path in environments where child_process spawning is blocked.
    cpus: 1,
    workerThreads: true,
    webpackBuildWorker: false,
  },
  async rewrites() {
    if (!proxyOrigin || !proxyApiBase) {
      return [];
    }

    return [
      {
        source: "/api/v1/:path*",
        destination: `${proxyApiBase}/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${proxyOrigin}/uploads/:path*`,
      },
    ];
  },
  async headers() {
    if (!permissionsPolicy) {
      return [];
    }

    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Permissions-Policy",
            value: permissionsPolicy,
          },
        ],
      },
    ];
  },
} as NextConfig;

export default nextConfig;
