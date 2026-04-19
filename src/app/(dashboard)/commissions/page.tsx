import { Suspense } from "react";
import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button-variants";
import { CommissionTable } from "@/components/commissions/commission-table";
import { CommissionFilters } from "@/components/commissions/commission-filters";
import { CommissionStatusBadge } from "@/components/commissions/commission-status-badge";
import type { CommissionStatus } from "@/types";
import type { Commission, Lead, User, Offer } from "@/generated/prisma/client";

interface CommissionWithRelations extends Commission {
  lead: Pick<Lead, "id" | "name" | "phone">;
  recruiter: Pick<User, "id" | "name">;
  offer: Pick<Offer, "id" | "company" | "accountType" | "language">;
}

interface PageProps {
  searchParams: Promise<{
    status?: string;
    offerId?: string;
    recruiterId?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: string;
  }>;
}

export default async function CommissionsPage({ searchParams }: PageProps) {
  const t = await getTranslations("commissions");
  const tCommon = await getTranslations("common");
  const locale = await getLocale();
  const session = await auth();
  const params = await searchParams;

  const statusParam = params.status as CommissionStatus | undefined;
  const offerId = params.offerId;
  const recruiterParam = params.recruiterId;
  const dateFrom = params.dateFrom;
  const dateTo = params.dateTo;
  const page = parseInt(params.page ?? "1", 10);
  const limit = 20;
  const skip = (page - 1) * limit;

  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";

  const where: Record<string, unknown> = {};

  if (!isSuperAdmin) {
    where.recruiterId = session?.user?.id;
  } else if (recruiterParam) {
    where.recruiterId = recruiterParam;
  }

  if (statusParam) where.status = statusParam;
  if (offerId) where.offerId = offerId;

  if (dateFrom || dateTo) {
    where.createdAt = {
      ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
      ...(dateTo ? { lte: new Date(dateTo) } : {}),
    };
  }

  const [commissionsRaw, total, offers, recruiters, summaryRaw] = await Promise.all([
    prisma.commission.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        lead: { select: { id: true, name: true, phone: true } },
        recruiter: { select: { id: true, name: true } },
        offer: {
          select: { id: true, company: true, accountType: true, language: true },
        },
      },
    }),
    prisma.commission.count({ where }),
    prisma.offer.findMany({
      select: { id: true, company: true, accountType: true },
      orderBy: { company: "asc" },
    }),
    isSuperAdmin
      ? prisma.user.findMany({
          where: { role: "RECRUITER" },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
    // Summary stats for header cards (scoped to same where, minus pagination)
    prisma.commission.groupBy({
      by: ["status"],
      where: isSuperAdmin ? {} : { recruiterId: session?.user?.id },
      _count: { _all: true },
      _sum: { amount: true },
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  // Build summary map
  const summary: Record<CommissionStatus, { count: number; total: number }> = {
    PENDING: { count: 0, total: 0 },
    ELIGIBLE: { count: 0, total: 0 },
    PAID: { count: 0, total: 0 },
  };
  for (const row of summaryRaw) {
    const s = row.status as CommissionStatus;
    summary[s] = {
      count: row._count._all,
      total: row._sum.amount ?? 0,
    };
  }

  const buildPageUrl = (p: number) => {
    const sp = new URLSearchParams({
      ...(statusParam ? { status: statusParam } : {}),
      ...(offerId ? { offerId } : {}),
      ...(recruiterParam ? { recruiterId: recruiterParam } : {}),
      ...(dateFrom ? { dateFrom } : {}),
      ...(dateTo ? { dateTo } : {}),
      page: String(p),
    });
    return `/commissions?${sp.toString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("found", { count: total })}
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {(["PENDING", "ELIGIBLE", "PAID"] as CommissionStatus[]).map((s) => (
          <div key={s} className="rounded-xl border bg-card p-4 space-y-1">
            <div className="flex items-center justify-between">
              <CommissionStatusBadge status={s} />
              <span className="text-2xl font-bold tabular-nums">
                {summary[s].count}
              </span>
            </div>
            <p className="text-sm text-muted-foreground tabular-nums">
              {formatCurrency(summary[s].total, undefined, locale)}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <Suspense>
        <CommissionFilters
          offers={offers}
          recruiters={recruiters}
          isSuperAdmin={isSuperAdmin}
        />
      </Suspense>

      {/* Table */}
      <CommissionTable
        commissions={commissionsRaw as CommissionWithRelations[]}
        isSuperAdmin={isSuperAdmin}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {page > 1 && (
            <Link
              href={buildPageUrl(page - 1)}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              {tCommon("previous")}
            </Link>
          )}
          <span className="text-sm text-muted-foreground">
            {t("pagination", { current: page, total: totalPages })}
          </span>
          {page < totalPages && (
            <Link
              href={buildPageUrl(page + 1)}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              {tCommon("next")}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
