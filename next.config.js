const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  scope: "/schafkopf/",
  sw: "sw.js",
  cacheOnFrontendNav: true,
  cacheStartUrl: true,
  workboxOptions: {
    runtimeCaching: [
      // Cache-first for card images (static, never change)
      {
        urlPattern: /\/schafkopf\/cards\/.*\.svg$/,
        handler: "CacheFirst",
        options: {
          cacheName: "card-images",
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
          },
        },
      },
      // Cache-first for audio files
      {
        urlPattern: /\/schafkopf\/audio\/.*\.mp3$/,
        handler: "CacheFirst",
        options: {
          cacheName: "audio-files",
          expiration: {
            maxEntries: 300,
            maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
          },
        },
      },
      // Network-first for API routes (game state must be fresh)
      {
        urlPattern: /\/schafkopf\/api\/.*/,
        handler: "NetworkFirst",
        options: {
          cacheName: "api-cache",
          networkTimeoutSeconds: 10,
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 60 * 5, // 5 minutes
          },
        },
      },
    ],
  },
  // Exclude large audio files from precaching (load on demand)
  publicExcludes: ["!audio/**/*"],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  basePath: '/schafkopf',
  assetPrefix: '/schafkopf',
  env: {
    NEXT_PUBLIC_BASE_PATH: '/schafkopf',
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
  },
};

module.exports = withPWA(nextConfig);
