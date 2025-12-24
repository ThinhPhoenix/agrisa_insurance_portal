/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        unoptimized: true,
    },
    compiler: {
        removeConsole: process.env.BUN_ENV === "production",
    },
    webpack: (config, { isServer }) => {
        // Fix for follow-redirects debug module issue
        config.resolve.fallback = {
            ...config.resolve.fallback,
            debug: false,
        };

        return config;
    },
    base: process.env.GITHUB_REPO
};

module.exports = nextConfig;
