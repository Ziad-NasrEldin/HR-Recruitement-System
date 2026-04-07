import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { FacebookGroupsClient } from "./facebook-groups-client";

export const metadata = { title: "Facebook Groups | HR Recruitment System" };

export default async function FacebookGroupsPage() {
  const session = await auth();
  if (session?.user?.role !== "SUPER_ADMIN") redirect("/dashboard");

  const groups = await prisma.facebookGroup.findMany({
    orderBy: [{ isDeprecated: "asc" }, { isActive: "desc" }, { name: "asc" }],
  });

  return <FacebookGroupsClient initialGroups={groups} />;
}
