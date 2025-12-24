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
    basePath: `/${process.env.GITHUB_REPO.split("/")[1]}`,
};

module.exports = nextConfig;
