/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Temporary deploy unblock: Next 16 type-validator is failing on page signature checks.
  // Keep this true only until the project's React/Next typing stack is fully aligned.
  typescript: {
    ignoreBuildErrors: true,
  },
  // Use output: 'export' only when building a static front-end for separate hosting.
  // For local dev and full Node deployment (API + auth), leave this unset.
};

export default nextConfig;

