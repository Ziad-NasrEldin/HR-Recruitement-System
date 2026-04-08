import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg", "pg", "bcryptjs"],
};

export default withNextIntl(nextConfig);
