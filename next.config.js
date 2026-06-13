/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for bcryptjs on Vercel serverless
  serverExternalPackages: ["bcryptjs"],

  experimental: {
    // Needed for Prisma on Vercel edge/serverless
    serverComponentsExternalPackages: ["@prisma/client", "bcryptjs"],
  },
};

module.exports = nextConfig;
