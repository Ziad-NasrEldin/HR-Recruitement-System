import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { CampaignsClient } from "./campaigns-client";

export const metadata = { title: "Campaigns | HR Recruitment System" };

export default async function CampaignsPage() {
  const session = await auth();
  if (session?.user?.role !== "SUPER_ADMIN") redirect("/dashboard");

  const groups = await prisma.facebookGroup.findMany({
    where: { isActive: true, isDeprecated: false, url: { not: null } },
    orderBy: { name: "asc" },
    select: { id: true, name: true, url: true },
  });

  return (
    <CampaignsClient
      availableGroups={groups.map((g) => ({ id: g.id, name: g.name, url: g.url! }))}
    />
  );
}
