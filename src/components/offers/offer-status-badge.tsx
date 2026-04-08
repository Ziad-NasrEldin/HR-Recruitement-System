import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import type { OfferStatus } from "@/generated/prisma/client";

interface OfferStatusBadgeProps {
  status: OfferStatus;
}

export async function OfferStatusBadge({ status }: OfferStatusBadgeProps) {
  const t = await getTranslations("offers");

  if (status === "ACTIVE") {
    return (
      <Badge variant="default" className="bg-emerald-600 text-white dark:bg-emerald-500">
        {t("status.ACTIVE")}
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="text-muted-foreground">
      {t("status.ON_HOLD")}
    </Badge>
  );
}
