/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  poweredByHeader: false,
  async redirects() {
    // Stare adresy z WordPressa - hurtowo na nowe sekcje
    return [
      { source: '/category/:path*', destination: '/wakacje/', permanent: true },
      { source: '/tag/:path*', destination: '/wakacje/', permanent: true },
      { source: '/wp-content/:path*', destination: '/', permanent: true },
      { source: '/feed', destination: '/', permanent: true },
    ];
  },
};
export default nextConfig;
