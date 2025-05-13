
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Provide fallbacks for Node.js core modules to prevent them from being bundled on the client
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false, // file system module, not available in browser
        child_process: false, // child process module, not available in browser
        net: false, // net module, not available in browser
        tls: false, // tls module, not available in browser
      };
    }
    return config;
  },
};

export default nextConfig;
