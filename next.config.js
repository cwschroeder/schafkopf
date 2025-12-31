/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // Für VPS Deployment - enthält alle Dependencies
}

module.exports = nextConfig
