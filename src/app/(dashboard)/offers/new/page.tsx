import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { requireSuperAdmin } from "@/lib/auth-utils";
import { OfferForm } from "@/components/offers/offer-form";

interface PageProps {}

export default async function NewOfferPage({}: PageProps) {
  await requireSuperAdmin();
  const t = await getTranslations("offers");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/offers"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ChevronLeft className="h-4 w-4" />
          {t("form.backToOffers")}
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">{t("form.titleCreate")}</h1>
        <p className="text-sm text-muted-foreground">{t("form.fillDetails")}</p>
      </div>

      <OfferForm />
    </div>
  );
}
