import type { NextConfig } from 'next';

/**
 * Static export served under /offline-detector/demo on GitHub Pages (the docs own the site root).
 * Next 16 builds with Turbopack by default, so there is no bundler flag and no webpack config.
 */
const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/offline-detector/demo',
  // Every route becomes <route>/index.html, which any static host serves without rewrites.
  trailingSlash: true,
  // The image optimiser needs a server; the demo uses no images anyway.
  images: { unoptimized: true },
};

export default nextConfig;
