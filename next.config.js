/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',  // 静的エクスポートのために必要
  basePath: '/drum-machine', // GitHub Pagesのサブディレクトリに合わせる
  assetPrefix: '/drum-machine/', // トレイリングスラッシュが必要
  trailingSlash: true, // これを追加
  images: {
    unoptimized: true, // 静的エクスポートでは画像最適化を無効化
  },
}

module.exports = nextConfig 