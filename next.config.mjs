import path from "node:path";

/** Relative path for Turbopack; Webpack resolves it to an absolute path below. */
const requestConfig = "./i18n/request.ts";

/**
 * Manual next-intl setup (no `next-intl/plugin` import).
 * next-intl >= 4.5 pulls @swc/core into the plugin for optional message
 * extraction; that native binary fails on many cPanel hosts (ERR_DLOPEN_FAILED /
 * noexec). We only need the `next-intl/config` alias.
 */
/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    resolveAlias: {
      "next-intl/config": requestConfig,
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
