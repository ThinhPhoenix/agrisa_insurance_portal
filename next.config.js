/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  compiler: {
    removeConsole: process.env.BUN_ENV === "production",
  },
};

module.exports = nextConfig;
