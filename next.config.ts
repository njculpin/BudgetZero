import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "54321",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/projects/:project_id/models",
        destination: "/projects/:project_id",
        permanent: true,
      },
      {
        source: "/projects/:project_id/models/:id",
        destination: "/assets/:id",
        permanent: true,
      },
      {
        source: "/projects/:project_id/models/:id/settings",
        destination: "/assets/:id/settings",
        permanent: true,
      },
      {
        source: "/projects/:project_id/illustrations",
        destination: "/projects/:project_id",
        permanent: true,
      },
      {
        source: "/projects/:project_id/illustrations/:id",
        destination: "/assets/:id",
        permanent: true,
      },
      {
        source: "/projects/:project_id/illustrations/:id/settings",
        destination: "/assets/:id/settings",
        permanent: true,
      },
      {
        source: "/projects/:project_id/create-model",
        destination: "/assets/upload?type=model",
        permanent: false,
      },
      {
        source: "/projects/:project_id/create-illustration",
        destination: "/assets/upload?type=illustration",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
