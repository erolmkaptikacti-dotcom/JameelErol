import type { NextConfig } from "next";

// GitHub Pages serves project sites from /<repo-name>, so production builds need a basePath.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
