/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  // Ensure proper watching for file changes in Docker
  webpack: (config: any) => {
    config.watchOptions = {
      poll: 1000,
      aggregateTimeout: 300,
    };
    return config;
  },
};

export default config;
