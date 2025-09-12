/** @type {import('next').NextConfig} */
const nextConfig = {
  compiler: {
    removeConsole: process.env.BUN_ENV === "production",
  },
};

module.exports = nextConfig;
