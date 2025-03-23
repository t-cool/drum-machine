/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/drum-machine',
  assetPrefix: '/drum-machine/',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
