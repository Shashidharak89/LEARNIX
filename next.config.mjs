/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  images: {
    domains: [
      "learnix.shashi-k.in",  // your own domain
      "res.cloudinary.com",   // allow Cloudinary images
      "lh3.googleusercontent.com", // Google profile avatars
    ],
  },

  trailingSlash: false,
};

export default nextConfig;
