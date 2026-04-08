import { getTranslations } from "next-intl/server";

export const metadata = { title: "Analytics | HR Recruitment System" };

export default async function AnalyticsPage() {
  const t = await getTranslations("analytics");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
      <p className="text-muted-foreground">{t("description")}</p>
    </div>
  );
}
