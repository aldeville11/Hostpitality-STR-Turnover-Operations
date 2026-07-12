import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow cloud-agent / preview hosts to load Next.js HMR assets in development.
  allowedDevOrigins: [
    "*.agent.cvm.dev",
    "*.cursor.sh",
    "localhost",
    "127.0.0.1",
  ],
};

export default nextConfig;
