/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  images: {
    domains: [
      'learnix.shashi-k.in', // allow Next.js Image optimization for your domain
    ],
  },

  i18n: {
    locales: ['en'],
    defaultLocale: 'en',
  },

  // Generate sitemap & robots.txt later with next-sitemap (not built-in)
  // but this config ensures clean URLs and SEO-friendly routing
  trailingSlash: false,
};

export default nextConfig;
