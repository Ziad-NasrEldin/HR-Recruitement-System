"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";

interface Props {
  isActive: boolean;
  trialEndsAt?: Date | null;
  accountExpiresAt?: Date | null;
}

export function UserStatusBadge({ isActive, trialEndsAt, accountExpiresAt }: Props) {
  const t = useTranslations("settings");

  if (!isActive) {
    return <Badge variant="destructive">{t("status.inactive")}</Badge>;
  }

  const now = new Date();

  if (accountExpiresAt && new Date(accountExpiresAt) < now) {
    return <Badge variant="destructive">{t("status.expired")}</Badge>;
  }

  if (trialEndsAt) {
    const trialEnd = new Date(trialEndsAt);
    if (trialEnd < now) {
      return <Badge variant="destructive">{t("status.trialEnded")}</Badge>;
    }
    const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return (
      <Badge variant="secondary">
        {t("status.trialDaysLeft", { days: daysLeft })}
      </Badge>
    );
  }

  return <Badge variant="default">{t("status.active")}</Badge>;
}
