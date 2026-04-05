import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PostGeneratorClient } from "./post-generator-client";

export const metadata = { title: "Post Generator | HR Recruitment System" };

export default async function PostGeneratorPage() {
  const session = await auth();

  if (session?.user?.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  const offers = await prisma.offer.findMany({
    where: { status: "ACTIVE" },
    select: {
      id: true,
      company: true,
      accountType: true,
      language: true,
      location: true,
    },
    orderBy: { company: "asc" },
  });

  return <PostGeneratorClient offers={offers} />;
}
