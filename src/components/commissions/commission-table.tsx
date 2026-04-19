"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { CommissionStatusBadge } from "./commission-status-badge";
import { MoreHorizontal, ExternalLink } from "lucide-react";
import { cn, formatDate, formatCurrency } from "@/lib/utils";
import type { Commission, Lead, User, Offer } from "@/generated/prisma/client";
import type { CommissionStatus } from "@/types";

interface CommissionWithRelations extends Commission {
  lead: Pick<Lead, "id" | "name" | "phone">;
  recruiter: Pick<User, "id" | "name">;
  offer: Pick<Offer, "id" | "company" | "accountType" | "language">;
}

interface Props {
  commissions: CommissionWithRelations[];
  isSuperAdmin: boolean;
}

export function CommissionTable({ commissions: initial, isSuperAdmin }: Props) {
  const t = useTranslations("commissions");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const [commissions, setCommissions] = useState<CommissionWithRelations[]>(initial);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const router = useRouter();

  async function updateStatus(id: string, status: CommissionStatus) {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/commissions/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const data = await res.json();
        setCommissions((prev) =>
          prev.map((c) =>
            c.id === id
              ? {
                  ...c,
                  status: data.commission.status,
                  eligibleDate: data.commission.eligibleDate
                    ? new Date(data.commission.eligibleDate)
                    : null,
                  paidDate: data.commission.paidDate
                    ? new Date(data.commission.paidDate)
                    : null,
                }
              : c
          )
        );
        router.refresh();
      }
    } finally {
      setLoadingId(null);
    }
  }

  if (commissions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
        <p className="text-muted-foreground">{t("empty")}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm" aria-label={t("title")}>
          <thead className="border-b bg-muted/40">
            <tr>
              <th scope="col" className="px-4 py-3 text-left font-medium text-muted-foreground">{t("table.candidate")}</th>
              <th scope="col" className="px-4 py-3 text-left font-medium text-muted-foreground">{t("table.offer")}</th>
              {isSuperAdmin && (
                <th scope="col" className="px-4 py-3 text-left font-medium text-muted-foreground">{t("table.recruiter")}</th>
              )}
              <th scope="col" className="px-4 py-3 text-left font-medium text-muted-foreground">{t("table.amount")}</th>
              <th scope="col" className="px-4 py-3 text-left font-medium text-muted-foreground">{t("table.status")}</th>
              <th scope="col" className="px-4 py-3 text-left font-medium text-muted-foreground">{t("table.eligible")}</th>
              <th scope="col" className="px-4 py-3 text-left font-medium text-muted-foreground">{t("table.paid")}</th>
              <th scope="col" className="px-4 py-3 text-left font-medium text-muted-foreground">{t("table.created")}</th>
              {isSuperAdmin && <th scope="col" className="w-10" />}
            </tr>
          </thead>
          <tbody className="divide-y">
            {commissions.map((c) => (
              <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3">
                  <Link
                    href={`/leads/${c.lead.id}`}
                    className="inline-flex items-center gap-1 font-medium text-foreground hover:underline"
                  >
                    {c.lead.name}
                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                  </Link>
                  <p className="text-xs text-muted-foreground mt-0.5">{c.lead.phone}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium">{c.offer.company}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.offer.accountType} · {c.offer.language}
                  </p>
                </td>
                {isSuperAdmin && (
                  <td className="px-4 py-3 text-muted-foreground">{c.recruiter.name}</td>
                )}
                <td className="px-4 py-3 font-medium tabular-nums">
                  {formatCurrency(c.amount, undefined, locale)}
                </td>
                <td className="px-4 py-3">
                  <CommissionStatusBadge status={c.status} />
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatDate(c.eligibleDate, locale)}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatDate(c.paidDate, locale)}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatDate(c.createdAt, locale)}
                </td>
                {isSuperAdmin && (
                  <td className="px-2 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                        disabled={loadingId === c.id}
                        aria-label={tCommon("actions")}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {c.status !== "ELIGIBLE" && (
                          <DropdownMenuItem onClick={() => updateStatus(c.id, "ELIGIBLE")}>
                            {t("actions.markEligible")}
                          </DropdownMenuItem>
                        )}
                        {c.status !== "PAID" && (
                          <DropdownMenuItem onClick={() => updateStatus(c.id, "PAID")}>
                            {t("actions.markPaid")}
                          </DropdownMenuItem>
                        )}
                        {c.status !== "PENDING" && (
                          <DropdownMenuItem onClick={() => updateStatus(c.id, "PENDING")}>
                            {t("actions.resetToPending")}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
