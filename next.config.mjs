/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config o/** @type {import('next').NextConfig} */

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "zmnbpybycdhdevoiczpo.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};




export default nextConfig;
