/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  // Intentional type error for testing: reactStrictMode should be boolean, not string
  reactStrictMode: "true",
};

export default config;
