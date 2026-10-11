import type { NextConfig } from "next";

const isExport = process.env.NEXT_EXPORT === "true";

const nextConfig: NextConfig = {
  ...(isExport
    ? {
        output: "export",
        basePath: "/nse-ai-copilot",
        images: { unoptimized: true },
      }
    : {}),
};

export default nextConfig;
