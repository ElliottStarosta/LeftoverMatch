/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  serverExternalPackages: ['@firebase/firestore', '@firebase/auth', '@firebase/storage', 'firebase'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('@firebase/firestore', '@firebase/auth', '@firebase/storage', 'firebase')
    }
    return config
  }
}

module.exports = nextConfig
