import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable static export for GitHub Pages
  output: 'export',
  // Set base path for GitHub Pages (will be your repo name)
  // basePath: process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_USE_GITHUB_PAGES === 'true' ? '/LKRM-FE-Demo' : '',
  // Disable image optimization for static export
  images: {
    unoptimized: true,
  },
  // Disable trailing slash for static export
  trailingSlash: false,
  webpack(config) {
    // Handle SVG imports
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });
    return config;
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
