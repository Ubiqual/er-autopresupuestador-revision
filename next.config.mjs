/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  env: {
    AUTH0_BASE_URL:
      process.env.VERCEL_ENV === 'production' || process.env.VERCEL_ENV === 'preview'
        ? process.env.AUTH0_BASE_URL
        : 'http://localhost:3000'
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack']
    });

    return config;
  }
};

export default nextConfig;
