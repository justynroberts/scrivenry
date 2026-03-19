/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  basePath: '/scrivenry',
  serverExternalPackages: ['better-sqlite3'],
}

module.exports = nextConfig
