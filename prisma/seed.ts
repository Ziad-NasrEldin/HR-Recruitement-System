import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";

// Prisma 7 generated constructor requires adapter/accelerateUrl in its type signature
// but works at runtime with DATABASE_URL env var and no arguments.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error Prisma 7 constructor type mismatch with no-adapter usage
const prisma = new PrismaClient();

async function main() {
  const email = process.env.SUPER_ADMIN_EMAIL || "ziad@hrrecruit.com";
  const password = process.env.SUPER_ADMIN_PASSWORD || "admin123456";
  const name = process.env.SUPER_ADMIN_NAME || "Ziad";

  console.log(`Seeding super admin: ${email}`);

  const existingAdmin = await prisma.user.findUnique({
    where: { email },
  });

  if (existingAdmin) {
    console.log("Super admin already exists. Skipping.");
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      role: "SUPER_ADMIN",
      isActive: true,
    },
  });

  console.log(`Super admin created: ${admin.id} (${admin.email})`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
