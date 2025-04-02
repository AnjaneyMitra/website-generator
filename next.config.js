/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Disable ESLint during build until all issues are fixed
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
