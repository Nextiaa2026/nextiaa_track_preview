import path from "node:path";

/**
 * Avoid `next-intl/plugin` here: it loads @swc/core native binaries and breaks
 * on many cPanel hosts. The alias alone is enough for normal next-intl usage.
 */
/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    resolveAlias: {
      "next-intl/config": "./i18n/request.ts",
    },
  },
  webpack(config) {
    config.resolve ??= {};
    config.resolve.alias ??= {};
    config.resolve.alias["next-intl/config"] = path.resolve(
      /* turbopackIgnore: true */ process.cwd(),
      "i18n/request.ts",
    );
    return config;
  },
};

export default nextConfig;
