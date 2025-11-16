/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  images: {
    domains: [
      "learnix.shashi-k.in",  // your own domain
      "res.cloudinary.com",   // allow Cloudinary images
    ],
  },

  i18n: {
    locales: ["en"],
    defaultLocale: "en",
  },

  trailingSlash: false,
};

export default nextConfig;
