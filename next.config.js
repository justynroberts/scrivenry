/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  basePath: '/scrivenry',
  serverExternalPackages: ['better-sqlite3'],
  // Expose basePath to client-side code (App Router does not have __NEXT_DATA__)
  env: {
    NEXT_PUBLIC_BASE_PATH: '/scrivenry',
  },
}

module.exports = nextConfig
