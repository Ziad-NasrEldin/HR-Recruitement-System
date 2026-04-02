import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Prisma 7 generated constructor requires adapter/accelerateUrl in its type signature
// but works at runtime with DATABASE_URL env var and no arguments.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error Prisma 7 constructor type mismatch with no-adapter usage
export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
