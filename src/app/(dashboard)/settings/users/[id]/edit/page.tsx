import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { requireSuperAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button-variants";
import { UserForm } from "@/components/users/user-form";

export const metadata = { title: "Edit User | HR Recruitment System" };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditUserPage({ params }: PageProps) {
  const t = await getTranslations("settings");
  await requireSuperAdmin();

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      trialEndsAt: true,
      accountExpiresAt: true,
    },
  });

  if (!user) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/settings"
          className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-8 w-8")}
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("editUserPage")}</h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <UserForm user={user} />
    </div>
  );
}
