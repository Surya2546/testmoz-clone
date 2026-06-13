/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // ✅ Correct key for Next.js 14 — serverExternalPackages is Next.js 15+ only
    serverComponentsExternalPackages: ["@prisma/client", "bcryptjs"],
  },
};

module.exports = nextConfig;
