/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Self-contained server bundle (.next/standalone) for deployment without node_modules on the server.
  output: 'standalone',
};

export default nextConfig;
