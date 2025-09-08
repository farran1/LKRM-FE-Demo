import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Performance optimizations
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['antd', '@ant-design/icons'],
  },
  
  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },
  
  // Compression
  compress: true,
  
  // Bundle analyzer (optional - remove in production)
  // bundleAnalyzer: process.env.ANALYZE === 'true',
  
  webpack(config, { dev, isServer }) {
    // Handle SVG imports
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });
    
    // Performance optimizations
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
            },
            antd: {
              test: /[\\/]node_modules[\\/]antd[\\/]/,
              name: 'antd',
              chunks: 'all',
            },
          },
        },
      };
    }
    
    return config;
  },
  
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
