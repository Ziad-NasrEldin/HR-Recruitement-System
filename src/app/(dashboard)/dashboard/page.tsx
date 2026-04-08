import { auth } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Briefcase, DollarSign, Activity } from "lucide-react";

export const metadata = {
  title: "Dashboard | HR Recruitment System",
};

export default async function DashboardPage() {
  const session = await auth();
  const t = await getTranslations("dashboard");

  const userName = session?.user?.name ?? session?.user?.email ?? "";

  return (
    <div className="space-y-12 py-4">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tighter">{t("title")}</h1>
          <p className="text-muted-foreground text-lg">
            {t("welcome", { name: userName })}
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-accent-premium/10 text-accent-premium text-xs font-medium border border-accent-premium/20">
          <Activity className="h-3 w-3" />
          {t("systemOperational")}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
        {/* Large Feature Card */}
        <div className="md:col-span-3 md:row-span-2 relative p-2 rounded-[2rem] bg-accent/50 border border-border ring-1 ring-border/50 shadow-xl shadow-accent-premium/5">
          <div className="h-full bg-card rounded-[calc(2rem-0.5rem)] p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] flex flex-col justify-between">
            <div>
              <CardHeader className="p-0 mb-4">
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                  <Users className="h-5 w-5 text-accent-premium" />
                  {t("totalLeads")}
                </CardTitle>
              </CardHeader>
              <div className="text-6xl font-bold tracking-tighter mt-4">1,284</div>
              <p className="text-muted-foreground mt-2 text-balance">
                {t("totalCandidates")}
              </p>
            </div>
            <div className="mt-8 pt-6 border-t border-border flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("pipelineHealth")}</span>
              <span className="text-sm font-bold text-accent-premium">+12.5% {t("thisMonth")}</span>
            </div>
          </div>
        </div>

        {/* Medium Card 1 */}
        <div className="md:col-span-3 relative p-2 rounded-[2rem] bg-accent/50 border border-border ring-1 ring-border/50 shadow-xl shadow-accent-premium/5">
          <div className="h-full bg-card rounded-[calc(2rem-0.5rem)] p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
            <CardHeader className="p-0 flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-accent-premium" />
                {t("activeOffers")}
              </CardTitle>
              <div className="text-xs font-bold bg-accent-premium/10 text-accent-premium px-2 py-0.5 rounded-full">
                {t("live")}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-3xl font-bold tracking-tighter">42</div>
              <p className="text-xs text-muted-foreground mt-1">{t("activeRecruitmentCampaigns")}</p>
            </CardContent>
          </div>
        </div>

        {/* Medium Card 2 */}
        <div className="md:col-span-3 relative p-2 rounded-[2rem] bg-accent/50 border border-border ring-1 ring-border/50 shadow-xl shadow-accent-premium/5">
          <div className="h-full bg-card rounded-[calc(2rem-0.5rem)] p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
            <CardHeader className="p-0 flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-accent-premium" />
                {t("pendingCommissions")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-3xl font-bold tracking-tighter">$12,450</div>
              <p className="text-xs text-muted-foreground mt-1">{t("awaitingVerification")}</p>
            </CardContent>
          </div>
        </div>

        {/* Bottom Full Width / Split */}
        <div className="md:col-span-6 relative p-2 rounded-[2rem] bg-accent/50 border border-border ring-1 ring-border/50 shadow-xl shadow-accent-premium/5">
          <div className="h-full bg-card rounded-[calc(2rem-0.5rem)] p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
            <div className="flex items-center justify-between mb-6">
              <CardHeader className="p-0">
                <CardTitle className="text-xl font-bold tracking-tight flex items-center gap-2">
                  <Activity className="h-5 w-5 text-accent-premium" />
                  {t("recentActivity")}
                </CardTitle>
              </CardHeader>
              <button className="text-xs font-medium text-accent-premium hover:underline">{t("viewAll")}</button>
            </div>
            <div className="grid gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-8 w-8 rounded-full bg-accent-premium/20 text-accent-premium flex items-center justify-center text-xs font-bold">
                      {i}
                    </div>
                    <div>
                      <p className="text-sm font-medium">Candidate applied for Senior Frontend Engineer</p>
                      <p className="text-xs text-muted-foreground">2 hours ago</p>
                    </div>
                  </div>
                  <div className="text-xs font-medium text-muted-foreground">{t("processed")}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}