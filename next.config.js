/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  experimental: {
    serverActions: {
      // Audio files are sent to the server action, so allow bodies larger than the 1MB default.
      bodySizeLimit: "25mb",
    },
  },
};

export default config;
