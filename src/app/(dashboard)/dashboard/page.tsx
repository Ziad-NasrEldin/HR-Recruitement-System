import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { getLocale, getTranslations } from "next-intl/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  Briefcase,
  CalendarClock,
  DollarSign,
  TrendingUp,
  Users,
} from "lucide-react";

export const metadata = {
  title: "Dashboard | HR Recruitment System",
};

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function formatNumber(value: number, locale: string) {
  const tag =
    locale === "ar"
      ? "ar-EG"
      : locale === "fr"
        ? "fr-FR"
        : locale === "de"
          ? "de-DE"
          : "en-GB";

  return new Intl.NumberFormat(tag).format(value);
}

export default async function DashboardPage() {
  const session = await auth();
  const locale = await getLocale();
  const t = await getTranslations("dashboard");
  const tLeadStatus = await getTranslations("leads.status");

  const userName = session?.user?.name ?? session?.user?.email ?? "";
  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";
  const recruiterId = session?.user?.id;

  const leadWhere = isSuperAdmin || !recruiterId ? {} : { recruiterId };
  const commissionWhere = isSuperAdmin || !recruiterId ? {} : { recruiterId };
  const reminderWhere = isSuperAdmin || !recruiterId ? {} : { recruiterId };

  const now = new Date();
  const last30Days = addDays(startOfDay(now), -29);

  const [
    totalLeads,
    activeOffers,
    commissionSummary,
    recentLeadCount,
    recentActivity,
    overdueReminders,
  ] = await Promise.all([
    prisma.lead.count({ where: leadWhere }),
    prisma.offer.count({ where: { status: "ACTIVE" } }),
    prisma.commission.aggregate({
      where: {
        ...commissionWhere,
        status: "PENDING",
      },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.lead.count({
      where: {
        ...leadWhere,
        createdAt: { gte: last30Days },
      },
    }),
    prisma.lead.findMany({
      where: leadWhere,
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        status: true,
        updatedAt: true,
        recruiter: { select: { name: true } },
        offer: { select: { company: true } },
      },
    }),
    prisma.followUpReminder.count({
      where: {
        ...reminderWhere,
        isCompleted: false,
        dueDate: { lt: now },
      },
    }),
  ]);

  const pendingCommissionValue = commissionSummary._sum.amount ?? 0;
  const pendingCommissionCount = commissionSummary._count._all;

  return (
    <div className="space-y-12 py-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tighter">{t("title")}</h1>
          <p className="text-lg text-muted-foreground">
            {t("welcome", { name: userName })}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-accent-premium/20 bg-accent-premium/10 px-3 py-1 text-xs font-medium text-accent-premium">
          <Activity className="h-3 w-3" />
          {t("systemOperational")}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-6">
        <div className="relative rounded-[2rem] border border-border bg-accent/50 p-2 ring-1 ring-border/50 shadow-xl shadow-accent-premium/5 md:col-span-3 md:row-span-2">
          <div className="flex h-full flex-col justify-between rounded-[calc(2rem-0.5rem)] bg-card p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
            <div>
              <CardHeader className="mb-4 p-0">
                <CardTitle className="flex items-center gap-2 text-lg font-medium">
                  <Users className="h-5 w-5 text-accent-premium" />
                  {t("totalLeads")}
                </CardTitle>
              </CardHeader>
              <div className="mt-4 text-6xl font-bold tracking-tighter">
                {formatNumber(totalLeads, locale)}
              </div>
              <p className="mt-2 text-balance text-muted-foreground">
                {t("totalCandidates")}
              </p>
            </div>
            <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {t("pipelineHealth")}
              </span>
              <span className="text-sm font-bold text-accent-premium">
                {t("recentLeads", {
                  count: formatNumber(recentLeadCount, locale),
                })}
              </span>
            </div>
          </div>
        </div>

        <div className="relative rounded-[2rem] border border-border bg-accent/50 p-2 ring-1 ring-border/50 shadow-xl shadow-accent-premium/5 md:col-span-3">
          <div className="h-full rounded-[calc(2rem-0.5rem)] bg-card p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-4">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Briefcase className="h-4 w-4 text-accent-premium" />
                {t("activeOffers")}
              </CardTitle>
              <div className="rounded-full bg-accent-premium/10 px-2 py-0.5 text-xs font-bold text-accent-premium">
                {t("live")}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-3xl font-bold tracking-tighter">
                {formatNumber(activeOffers, locale)}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("activeRecruitmentCampaigns")}
              </p>
            </CardContent>
          </div>
        </div>

        <div className="relative rounded-[2rem] border border-border bg-accent/50 p-2 ring-1 ring-border/50 shadow-xl shadow-accent-premium/5 md:col-span-3">
          <div className="h-full rounded-[calc(2rem-0.5rem)] bg-card p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-4">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <DollarSign className="h-4 w-4 text-accent-premium" />
                {t("pendingCommissions")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-3xl font-bold tracking-tighter">
                {formatCurrency(pendingCommissionValue, "EGP", locale)}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("awaitingVerification", {
                  count: formatNumber(pendingCommissionCount, locale),
                })}
              </p>
            </CardContent>
          </div>
        </div>

        <div className="relative rounded-[2rem] border border-border bg-accent/50 p-2 ring-1 ring-border/50 shadow-xl shadow-accent-premium/5 md:col-span-6">
          <div className="h-full rounded-[calc(2rem-0.5rem)] bg-card p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
            <div className="mb-6 flex items-center justify-between">
              <CardHeader className="p-0">
                <CardTitle className="flex items-center gap-2 text-xl font-bold tracking-tight">
                  <TrendingUp className="h-5 w-5 text-accent-premium" />
                  {t("recentActivity")}
                </CardTitle>
                <CardDescription className="pt-1">
                  {t("recentActivityDescription", {
                    overdue: formatNumber(overdueReminders, locale),
                  })}
                </CardDescription>
              </CardHeader>
              <Link
                href="/leads"
                className="text-xs font-medium text-accent-premium hover:underline"
              >
                {t("viewAll")}
              </Link>
            </div>
            <div className="grid gap-4">
              {recentActivity.length ? (
                recentActivity.map((lead, index) => (
                  <div
                    key={lead.id}
                    className="flex items-center justify-between rounded-2xl border border-border/50 bg-muted/30 p-4 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-premium/20 text-xs font-bold text-accent-premium">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {lead.name}
                          {lead.offer?.company ? ` · ${lead.offer.company}` : ""}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {isSuperAdmin
                            ? t("activityByRecruiter", {
                                recruiter: lead.recruiter.name,
                                updatedAt: formatDateTime(lead.updatedAt, locale),
                              })
                            : t("activityUpdated", {
                                updatedAt: formatDateTime(lead.updatedAt, locale),
                              })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {lead.status === "INTERVIEW_SCHEDULED" ? (
                        <CalendarClock className="h-4 w-4 text-amber-500" />
                      ) : null}
                      <Badge variant="secondary">{tLeadStatus(lead.status)}</Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-border/50 bg-muted/30 p-4 text-sm text-muted-foreground">
                  {t("noRecentActivity")}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
