/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  images: {
    domains: [
      "learnix.shashi-k.in",  // your own domain
      "res.cloudinary.com",   // allow Cloudinary images
    ],
  },

  trailingSlash: false,
};

export default nextConfig;
