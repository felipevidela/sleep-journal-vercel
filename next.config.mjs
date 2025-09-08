
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Server Actions are stable in Next 14, this ensures compatibility
  },
};

export default nextConfig;
