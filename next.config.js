/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed 'standalone' output - it causes issues with npm run start
  serverExternalPackages: ['better-sqlite3'],
}

module.exports = nextConfig
