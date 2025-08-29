/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['sharp', 'archiver'],
  },
  images: {
    domains: ['localhost'],
  },
};

module.exports = nextConfig;