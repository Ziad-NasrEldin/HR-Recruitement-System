import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cn, formatCurrency, formatDateTime } from "@/lib/utils";
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
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileAudio2,
  HandCoins,
  Layers3,
  TrendingUp,
  UserRound,
} from "lucide-react";
import type {
  CommissionStatus,
  LeadStatus,
  ValidationStatus,
} from "@/generated/prisma/client";
import { getLocale, getTranslations } from "next-intl/server";

export const metadata = { title: "Analytics | HR Recruitment System" };

const LEAD_STATUS_ORDER: LeadStatus[] = [
  "SOURCED",
  "CONTACTED",
  "VOICE_NOTE_SENT",
  "VALIDATED",
  "INTERVIEW_SCHEDULED",
  "INTERVIEWED",
  "ACCEPTED",
  "REJECTED",
  "IN_TRAINING",
  "COMMISSION_ELIGIBLE",
  "COMMISSION_PAID",
];

const PLACED_STATUSES: LeadStatus[] = [
  "ACCEPTED",
  "IN_TRAINING",
  "COMMISSION_ELIGIBLE",
  "COMMISSION_PAID",
];

const ACTIVE_PIPELINE_STATUSES: LeadStatus[] = [
  "SOURCED",
  "CONTACTED",
  "VOICE_NOTE_SENT",
  "VALIDATED",
  "INTERVIEW_SCHEDULED",
  "INTERVIEWED",
  "ACCEPTED",
  "IN_TRAINING",
  "COMMISSION_ELIGIBLE",
];

const COMMISSION_STATUS_ORDER: CommissionStatus[] = [
  "PENDING",
  "ELIGIBLE",
  "PAID",
];

const VOICE_NOTE_STATUS_ORDER: ValidationStatus[] = [
  "PENDING",
  "APPROVED",
  "REJECTED",
];

function localeTag(locale: string) {
  switch (locale) {
    case "ar":
      return "ar-EG";
    case "fr":
      return "fr-FR";
    case "de":
      return "de-DE";
    default:
      return "en-GB";
  }
}

function formatNumber(value: number, locale: string) {
  return new Intl.NumberFormat(localeTag(locale)).format(value);
}

function formatPercent(value: number, locale: string) {
  return new Intl.NumberFormat(localeTag(locale), {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(value);
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function bucketRecentDates(
  rows: Array<{ createdAt: Date }>,
  locale: string,
  days: number,
) {
  const today = startOfDay(new Date());
  const start = addDays(today, -(days - 1));

  const counts = new Map<string, number>();
  for (let i = 0; i < days; i += 1) {
    const key = addDays(start, i).toISOString().slice(0, 10);
    counts.set(key, 0);
  }

  for (const row of rows) {
    const key = startOfDay(new Date(row.createdAt)).toISOString().slice(0, 10);
    if (counts.has(key)) {
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries()).map(([key, count]) => {
    const date = new Date(`${key}T00:00:00.000Z`);
    return {
      key,
      count,
      label: new Intl.DateTimeFormat(localeTag(locale), {
        month: "short",
        day: "numeric",
      }).format(date),
    };
  });
}

function ratio(value: number, total: number) {
  if (!total) return 0;
  return value / total;
}

function getStatusCount(
  counts: Partial<Record<LeadStatus, number>>,
  statuses: LeadStatus[],
) {
  return statuses.reduce((sum, status) => sum + (counts[status] ?? 0), 0);
}

function getCommissionTotal(
  totals: Partial<Record<CommissionStatus, { count: number; amount: number }>>,
  statuses: CommissionStatus[],
) {
  return statuses.reduce(
    (sum, status) => sum + (totals[status]?.amount ?? 0),
    0,
  );
}

function BarRow({
  label,
  value,
  total,
  aside,
  tone = "default",
}: {
  label: string;
  value: number;
  total: number;
  aside?: string;
  tone?: "default" | "success" | "warning";
}) {
  const width = total > 0 ? Math.max((value / total) * 100, value > 0 ? 6 : 0) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground tabular-nums">
          {aside ?? value}
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted">
        <div
          className={cn(
            "h-2 rounded-full transition-[width]",
            tone === "success" && "bg-emerald-500/80",
            tone === "warning" && "bg-amber-500/80",
            tone === "default" && "bg-accent-premium/80",
          )}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

export default async function AnalyticsPage() {
  const session = await auth();
  const locale = await getLocale();
  const t = await getTranslations("analytics");
  const tLeadStatus = await getTranslations("leads.status");
  const tCommissionStatus = await getTranslations("commissions.status");

  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";
  const recruiterId = session?.user?.id;

  const leadWhere = isSuperAdmin || !recruiterId ? {} : { recruiterId };
  const commissionWhere = isSuperAdmin || !recruiterId ? {} : { recruiterId };
  const reminderWhere = isSuperAdmin || !recruiterId ? {} : { recruiterId };
  const voiceNoteWhere =
    isSuperAdmin || !recruiterId ? {} : { lead: { recruiterId } };

  const now = new Date();
  const last30Days = addDays(startOfDay(now), -29);
  const next7Days = addDays(now, 7);

  const [
    totalLeads,
    leadsLast30Days,
    activeOffers,
    leadStatusGroups,
    recentLeadRows,
    commissionGroups,
    voiceNoteGroups,
    overdueReminders,
    upcomingReminders,
    openReminders,
    latestLeadActivity,
    offerLeadGroups,
    offerCommissionGroups,
    recruiterLeadGroups,
    recruiterCommissionGroups,
  ] = await Promise.all([
    prisma.lead.count({ where: leadWhere }),
    prisma.lead.count({
      where: {
        ...leadWhere,
        createdAt: { gte: last30Days },
      },
    }),
    prisma.offer.count({
      where: { status: "ACTIVE" },
    }),
    prisma.lead.groupBy({
      by: ["status"],
      where: leadWhere,
      _count: { _all: true },
    }),
    prisma.lead.findMany({
      where: {
        ...leadWhere,
        createdAt: { gte: addDays(startOfDay(now), -13) },
      },
      select: { createdAt: true },
    }),
    prisma.commission.groupBy({
      by: ["status"],
      where: commissionWhere,
      _count: { _all: true },
      _sum: { amount: true },
    }),
    prisma.voiceNote.groupBy({
      by: ["validationStatus"],
      where: voiceNoteWhere,
      _count: { _all: true },
    }),
    prisma.followUpReminder.count({
      where: {
        ...reminderWhere,
        isCompleted: false,
        dueDate: { lt: now },
      },
    }),
    prisma.followUpReminder.count({
      where: {
        ...reminderWhere,
        isCompleted: false,
        dueDate: { gte: now, lte: next7Days },
      },
    }),
    prisma.followUpReminder.count({
      where: {
        ...reminderWhere,
        isCompleted: false,
      },
    }),
    prisma.lead.findMany({
      where: leadWhere,
      orderBy: { updatedAt: "desc" },
      take: 8,
      select: {
        id: true,
        name: true,
        status: true,
        updatedAt: true,
        recruiter: { select: { name: true } },
        offer: { select: { company: true, language: true } },
      },
    }),
    prisma.lead.groupBy({
      by: ["offerId"],
      where: {
        ...leadWhere,
        offerId: { not: null },
      },
      _count: { _all: true },
    }),
    prisma.commission.groupBy({
      by: ["offerId"],
      where: commissionWhere,
      _sum: { amount: true },
    }),
    isSuperAdmin
      ? prisma.lead.groupBy({
          by: ["recruiterId"],
          _count: { _all: true },
        })
      : Promise.resolve([]),
    isSuperAdmin
      ? prisma.commission.groupBy({
          by: ["recruiterId"],
          _sum: { amount: true },
        })
      : Promise.resolve([]),
  ]);

  const leadStatusCounts = Object.fromEntries(
    leadStatusGroups.map((row) => [row.status, row._count._all]),
  ) as Partial<Record<LeadStatus, number>>;

  const commissionStatusTotals = Object.fromEntries(
    commissionGroups.map((row) => [
      row.status,
      {
        count: row._count._all,
        amount: row._sum.amount ?? 0,
      },
    ]),
  ) as Partial<Record<CommissionStatus, { count: number; amount: number }>>;

  const voiceNoteCounts = Object.fromEntries(
    voiceNoteGroups.map((row) => [row.validationStatus, row._count._all]),
  ) as Partial<Record<ValidationStatus, number>>;

  const leadTrend = bucketRecentDates(recentLeadRows, locale, 14);
  const leadTrendPeak = Math.max(...leadTrend.map((entry) => entry.count), 1);

  const activePipelineCount = getStatusCount(
    leadStatusCounts,
    ACTIVE_PIPELINE_STATUSES,
  );
  const placedCount = getStatusCount(leadStatusCounts, PLACED_STATUSES);
  const interviewedCount = getStatusCount(leadStatusCounts, [
    "INTERVIEW_SCHEDULED",
    "INTERVIEWED",
    ...PLACED_STATUSES,
  ]);

  const pendingCommissionTotal = getCommissionTotal(commissionStatusTotals, [
    "PENDING",
  ]);
  const eligibleCommissionTotal = getCommissionTotal(commissionStatusTotals, [
    "ELIGIBLE",
  ]);
  const paidCommissionTotal = getCommissionTotal(commissionStatusTotals, ["PAID"]);

  const offerIds = Array.from(
    new Set([
      ...offerLeadGroups
        .map((row) => row.offerId)
        .filter((value): value is string => Boolean(value)),
      ...offerCommissionGroups
        .map((row) => row.offerId)
        .filter((value): value is string => Boolean(value)),
    ]),
  );

  const recruiterIds = Array.from(
    new Set([
      ...recruiterLeadGroups.map((row) => row.recruiterId),
      ...recruiterCommissionGroups.map((row) => row.recruiterId),
    ]),
  );

  const [offers, recruiters] = await Promise.all([
    offerIds.length
      ? prisma.offer.findMany({
          where: { id: { in: offerIds } },
          select: {
            id: true,
            company: true,
            language: true,
            accountType: true,
          },
        })
      : Promise.resolve([]),
    recruiterIds.length
      ? prisma.user.findMany({
          where: { id: { in: recruiterIds } },
          select: { id: true, name: true },
        })
      : Promise.resolve([]),
  ]);

  const offerMap = new Map(offers.map((offer) => [offer.id, offer]));
  const recruiterMap = new Map(recruiters.map((user) => [user.id, user]));
  const offerCommissionMap = new Map(
    offerCommissionGroups.map((row) => [row.offerId, row._sum.amount ?? 0]),
  );
  const recruiterCommissionMap = new Map(
    recruiterCommissionGroups.map((row) => [row.recruiterId, row._sum.amount ?? 0]),
  );

  const topOffers = offerLeadGroups
    .map((row) => {
      if (!row.offerId) return null;
      const offer = offerMap.get(row.offerId);
      if (!offer) return null;

      return {
        id: row.offerId,
        company: offer.company,
        subtitle: `${offer.language} · ${offer.accountType}`,
        leads: row._count._all,
        amount: offerCommissionMap.get(row.offerId) ?? 0,
      };
    })
    .filter((value): value is NonNullable<typeof value> => Boolean(value))
    .sort((a, b) => b.leads - a.leads || b.amount - a.amount)
    .slice(0, 5);

  const recruiterLeaderboard = recruiterLeadGroups
    .map((row) => {
      const recruiter = recruiterMap.get(row.recruiterId);
      if (!recruiter) return null;

      return {
        id: row.recruiterId,
        name: recruiter.name,
        leads: row._count._all,
        amount: recruiterCommissionMap.get(row.recruiterId) ?? 0,
      };
    })
    .filter((value): value is NonNullable<typeof value> => Boolean(value))
    .sort((a, b) => b.leads - a.leads || b.amount - a.amount)
    .slice(0, 5);

  const topOfferLeadCount = Math.max(...topOffers.map((offer) => offer.leads), 1);
  const topRecruiterLeadCount = Math.max(
    ...recruiterLeaderboard.map((row) => row.leads),
    1,
  );

  const activityCount = latestLeadActivity.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            {t("description")}
          </p>
        </div>
        <Badge variant="outline" className="gap-1.5 self-start">
          <Activity className="size-3.5" />
          {t("liveData")}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-l-4 border-l-accent-premium">
          <CardHeader>
            <CardDescription>{t("totalLeads")}</CardDescription>
            <CardTitle className="text-3xl font-bold">
              {formatNumber(totalLeads, locale)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {t("newLeadsLast30Days", {
              count: formatNumber(leadsLast30Days, locale),
            })}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-sky-500">
          <CardHeader>
            <CardDescription>{t("activeOffers")}</CardDescription>
            <CardTitle className="text-3xl font-bold">
              {formatNumber(activeOffers, locale)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {t("activePipeline", {
              count: formatNumber(activePipelineCount, locale),
            })}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader>
            <CardDescription>{t("openReminders")}</CardDescription>
            <CardTitle className="text-3xl font-bold">
              {formatNumber(openReminders, locale)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {t("reminderSplit", {
              overdue: formatNumber(overdueReminders, locale),
              upcoming: formatNumber(upcomingReminders, locale),
            })}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader>
            <CardDescription>{t("pendingCommissionValue")}</CardDescription>
            <CardTitle className="text-3xl font-bold">
              {formatCurrency(pendingCommissionTotal, "EGP", locale)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {t("placedLeads", {
              count: formatNumber(placedCount, locale),
              rate: formatPercent(ratio(placedCount, totalLeads), locale),
            })}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.3fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers3 className="size-4 text-accent-premium" />
              {t("pipelineBreakdown")}
            </CardTitle>
            <CardDescription>{t("pipelineBreakdownDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {LEAD_STATUS_ORDER.map((status) => (
              <BarRow
                key={status}
                label={tLeadStatus(status)}
                value={leadStatusCounts[status] ?? 0}
                total={totalLeads}
                aside={formatNumber(leadStatusCounts[status] ?? 0, locale)}
                tone={
                  status === "REJECTED"
                    ? "warning"
                    : PLACED_STATUSES.includes(status)
                      ? "success"
                      : "default"
                }
              />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="size-4 text-accent-premium" />
              {t("leadFlowLast14Days")}
            </CardTitle>
            <CardDescription>{t("leadFlowDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-14 items-end gap-2">
              {leadTrend.map((entry) => (
                <div key={entry.key} className="space-y-2 text-center">
                  <div className="flex h-28 items-end justify-center rounded-md bg-muted/40 p-1">
                    <div
                      className="w-full rounded-sm bg-accent-premium/80"
                      style={{
                        height: `${Math.max((entry.count / leadTrendPeak) * 100, entry.count > 0 ? 8 : 2)}%`,
                      }}
                      title={`${entry.label}: ${entry.count}`}
                    />
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {entry.label}
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-muted/40 p-3">
                <div className="text-muted-foreground">{t("interviewPipeline")}</div>
                <div className="mt-1 text-xl font-semibold">
                  {formatNumber(interviewedCount, locale)}
                </div>
              </div>
              <div className="rounded-lg bg-muted/40 p-3">
                <div className="text-muted-foreground">{t("placementRate")}</div>
                <div className="mt-1 text-xl font-semibold">
                  {formatPercent(ratio(placedCount, totalLeads), locale)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HandCoins className="size-4 text-accent-premium" />
              {t("commissionOverview")}
            </CardTitle>
            <CardDescription>{t("commissionDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {COMMISSION_STATUS_ORDER.map((status) => (
              <BarRow
                key={status}
                label={tCommissionStatus(status)}
                value={commissionStatusTotals[status]?.count ?? 0}
                total={Math.max(
                  ...COMMISSION_STATUS_ORDER.map(
                    (key) => commissionStatusTotals[key]?.count ?? 0,
                  ),
                  1,
                )}
                aside={formatCurrency(
                  commissionStatusTotals[status]?.amount ?? 0,
                  "EGP",
                  locale,
                )}
                tone={status === "PAID" ? "success" : status === "PENDING" ? "warning" : "default"}
              />
            ))}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-muted/40 p-3">
                <div className="text-muted-foreground">{t("eligibleValue")}</div>
                <div className="mt-1 font-semibold">
                  {formatCurrency(eligibleCommissionTotal, "EGP", locale)}
                </div>
              </div>
              <div className="rounded-lg bg-muted/40 p-3">
                <div className="text-muted-foreground">{t("paidValue")}</div>
                <div className="mt-1 font-semibold">
                  {formatCurrency(paidCommissionTotal, "EGP", locale)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileAudio2 className="size-4 text-accent-premium" />
              {t("voiceNoteValidation")}
            </CardTitle>
            <CardDescription>{t("voiceNoteDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {VOICE_NOTE_STATUS_ORDER.map((status) => (
              <BarRow
                key={status}
                label={t(`voiceStatus.${status}`)}
                value={voiceNoteCounts[status] ?? 0}
                total={Math.max(
                  ...VOICE_NOTE_STATUS_ORDER.map(
                    (key) => voiceNoteCounts[key] ?? 0,
                  ),
                  1,
                )}
                aside={formatNumber(voiceNoteCounts[status] ?? 0, locale)}
                tone={status === "APPROVED" ? "success" : status === "REJECTED" ? "warning" : "default"}
              />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="size-4 text-accent-premium" />
              {t("reminderQueue")}
            </CardTitle>
            <CardDescription>{t("reminderDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted/40 p-4">
              <div className="text-sm text-muted-foreground">{t("overdue")}</div>
              <div className="mt-1 text-2xl font-semibold tabular-nums">
                {formatNumber(overdueReminders, locale)}
              </div>
            </div>
            <div className="rounded-lg bg-muted/40 p-4">
              <div className="text-sm text-muted-foreground">{t("dueNext7Days")}</div>
              <div className="mt-1 text-2xl font-semibold tabular-nums">
                {formatNumber(upcomingReminders, locale)}
              </div>
            </div>
            <div className="rounded-lg bg-muted/40 p-4">
              <div className="text-sm text-muted-foreground">{t("totalOpen")}</div>
              <div className="mt-1 text-2xl font-semibold tabular-nums">
                {formatNumber(openReminders, locale)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className={cn("grid gap-4", isSuperAdmin ? "xl:grid-cols-2" : "xl:grid-cols-1")}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-accent-premium" />
              {t("topOffers")}
            </CardTitle>
            <CardDescription>{t("topOffersDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {topOffers.length ? (
              topOffers.map((offer) => (
                <div key={offer.id} className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">{offer.company}</div>
                      <div className="text-sm text-muted-foreground">
                        {offer.subtitle}
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <div className="font-medium tabular-nums">
                        {formatNumber(offer.leads, locale)} {t("leadsLabel")}
                      </div>
                      <div className="text-muted-foreground">
                        {formatCurrency(offer.amount, "EGP", locale)}
                      </div>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-emerald-500/80"
                      style={{
                        width: `${Math.max((offer.leads / topOfferLeadCount) * 100, 8)}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground">
                {t("noOfferData")}
              </div>
            )}
          </CardContent>
        </Card>

        {isSuperAdmin ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserRound className="size-4 text-accent-premium" />
                {t("recruiterLeaderboard")}
              </CardTitle>
              <CardDescription>
                {t("recruiterLeaderboardDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recruiterLeaderboard.length ? (
                recruiterLeaderboard.map((row, index) => (
                  <div key={row.id} className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex size-7 items-center justify-center rounded-full bg-accent-premium/10 text-xs font-semibold text-accent-premium">
                          {index + 1}
                        </div>
                        <div className="font-medium">{row.name}</div>
                      </div>
                      <div className="text-right text-sm">
                        <div className="font-medium tabular-nums">
                          {formatNumber(row.leads, locale)} {t("leadsLabel")}
                        </div>
                        <div className="text-muted-foreground">
                          {formatCurrency(row.amount, "EGP", locale)}
                        </div>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-sky-500/80"
                        style={{
                          width: `${Math.max((row.leads / topRecruiterLeadCount) * 100, 8)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">
                  {t("noRecruiterData")}
                </div>
              )}
            </CardContent>
          </Card>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock3 className="size-4 text-accent-premium" />
            {t("recentActivity")}
          </CardTitle>
          <CardDescription>{t("recentActivityDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {activityCount ? (
            latestLeadActivity.map((lead) => (
              <div
                key={lead.id}
                className="flex flex-col gap-3 rounded-xl border bg-muted/20 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="space-y-1">
                  <div className="font-medium">{lead.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {lead.offer?.company
                      ? `${lead.offer.company} · ${lead.offer.language}`
                      : t("unassignedOffer")}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {isSuperAdmin
                      ? t("activityMetaAdmin", {
                          recruiter: lead.recruiter.name,
                          updatedAt: formatDateTime(lead.updatedAt, locale),
                        })
                      : t("activityMeta", {
                          updatedAt: formatDateTime(lead.updatedAt, locale),
                        })}
                  </div>
                </div>
                <Badge variant="secondary">{tLeadStatus(lead.status)}</Badge>
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground">
              {t("noRecentActivity")}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
