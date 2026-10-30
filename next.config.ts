import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fully static site: every page is HTML at build time, all file processing happens in the browser.
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
