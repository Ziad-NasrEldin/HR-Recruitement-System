import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg", "pg", "bcryptjs"],
  async redirects() {
    return [
      {
        source: "/:locale(en|ar|fr|de)",
        destination: "/",
        permanent: false,
      },
      {
        source: "/:locale(en|ar|fr|de)/:path*",
        destination: "/:path*",
        permanent: false,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
