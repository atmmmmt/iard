import type { NextConfig } from "next";

// STATIC_EXPORT=1 → plain static site in `out/` for Apache/cPanel hosting
// (dynamic routes are served by public/.htaccess rewrites).
const isStaticExport = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = isStaticExport
  ? {
      output: "export",
      trailingSlash: true,
      images: { unoptimized: true },
      // Skip the unused Cloudflare/D1 scaffolding (db/, worker/) during type-check.
      typescript: { tsconfigPath: "tsconfig.export.json" },
    }
  : {};

export default nextConfig;
