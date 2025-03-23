/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/drum-machine',
  assetPrefix: '/drum-machine',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
