import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PostingSessionClient } from "./posting-session-client";

export const metadata = { title: "Posting Session | HR Recruitment System" };

export default async function PostingSessionPage() {
  const session = await auth();
  if (session?.user?.role !== "SUPER_ADMIN") redirect("/dashboard");

  const groups = await prisma.facebookGroup.findMany({
    where: { isActive: true, url: { not: null } },
    orderBy: { name: "asc" },
  });

  return <PostingSessionClient groups={groups as Array<{ id: string; name: string; url: string }> } />;
}
