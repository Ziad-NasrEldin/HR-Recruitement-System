"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { Button, buttonVariants } from "@/components/ui/button";
import { UserStatusBadge } from "./user-status-badge";
import { cn, formatDate } from "@/lib/utils";
import { Pencil, ToggleLeft, ToggleRight, Users } from "lucide-react";
import type { Role } from "@/types";

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  trialEndsAt: Date | null;
  accountExpiresAt: Date | null;
  createdAt: Date;
  _count: { leads: number };
}

interface Props {
  users: UserRow[];
  currentUserId: string;
}

export function UserTable({ users: initial, currentUserId }: Props) {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const [users, setUsers] = useState<UserRow[]>(initial);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const router = useRouter();

  async function toggleActive(id: string) {
    setTogglingId(id);
    try {
      const res = await fetch(`/api/users/${id}/toggle`, { method: "PATCH" });
      if (res.ok) {
        const data = await res.json();
        setUsers((prev) =>
          prev.map((u) => (u.id === id ? { ...u, isActive: data.user.isActive } : u))
        );
        router.refresh();
      }
    } finally {
      setTogglingId(null);
    }
  }

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
        <Users className="h-8 w-8 text-muted-foreground mb-3" />
        <p className="text-muted-foreground">{t("empty")}</p>
        <Link href="/settings/users/new" className={cn(buttonVariants({ variant: "outline" }), "mt-4")}>
          {t("createFirst")}
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-xl border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm" aria-label={t("title")}>
          <thead className="border-b bg-muted/40">
            <tr>
              <th scope="col" className="px-4 py-3 text-left font-medium text-muted-foreground">{t("table.name")}</th>
              <th scope="col" className="px-4 py-3 text-left font-medium text-muted-foreground">{t("table.role")}</th>
              <th scope="col" className="px-4 py-3 text-left font-medium text-muted-foreground">{t("table.status")}</th>
              <th scope="col" className="px-4 py-3 text-left font-medium text-muted-foreground">{t("table.trialEnds")}</th>
              <th scope="col" className="px-4 py-3 text-left font-medium text-muted-foreground">{t("table.expires")}</th>
              <th scope="col" className="px-4 py-3 text-left font-medium text-muted-foreground">{t("table.leads")}</th>
              <th scope="col" className="px-4 py-3 text-left font-medium text-muted-foreground">{t("table.joined")}</th>
              <th scope="col" className="px-4 py-3 text-right font-medium text-muted-foreground">{t("table.actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium">{u.name}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {t(`role.${u.role}`)}
                </td>
                <td className="px-4 py-3">
                  <UserStatusBadge
                    isActive={u.isActive}
                    trialEndsAt={u.trialEndsAt}
                    accountExpiresAt={u.accountExpiresAt}
                  />
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatDate(u.trialEndsAt, locale)}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatDate(u.accountExpiresAt, locale)}
                </td>
                <td className="px-4 py-3 text-muted-foreground tabular-nums">
                  {u._count.leads}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatDate(u.createdAt, locale)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      href={`/settings/users/${u.id}/edit`}
                      className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-8 w-8")}
                      aria-label={tCommon("edit")}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Link>
                    {u.id !== currentUserId && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => toggleActive(u.id)}
                        disabled={togglingId === u.id}
                        title={u.isActive ? t("deactivate") : t("activate")}
                        aria-label={u.isActive ? t("deactivate") : t("activate")}
                      >
                        {u.isActive ? (
                          <ToggleRight className="h-4 w-4 text-primary" />
                        ) : (
                          <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}