import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  // GitHub Pages serves the repo under /Degenerates; Vercel serves from root
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
};

export default nextConfig;
