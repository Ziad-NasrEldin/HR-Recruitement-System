import Link from "next/link";
import { Plus } from "lucide-react";
import { requireSuperAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button-variants";
import { UserTable } from "@/components/users/user-table";

export const metadata = { title: "Settings | HR Recruitment System" };

export default async function SettingsPage() {
  const session = await requireSuperAdmin();

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      trialEndsAt: true,
      accountExpiresAt: true,
      createdAt: true,
      _count: { select: { leads: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
          <p className="text-sm text-muted-foreground">
            {users.length} user{users.length !== 1 ? "s" : ""} registered
          </p>
        </div>
        <Link href="/settings/users/new" className={cn(buttonVariants())}>
          <Plus className="h-4 w-4" />
          New User
        </Link>
      </div>

      {/* Table */}
      <UserTable
        users={users}
        currentUserId={session.user.id}
      />
    </div>
  );
}
