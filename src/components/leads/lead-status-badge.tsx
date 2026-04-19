import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import type { LeadStatus } from "@/generated/prisma/client";

const STATUS_CLASSES: Record<LeadStatus, string> = {
  SOURCED: "bg-muted text-muted-foreground",
  CONTACTED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  VOICE_NOTE_SENT: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  VALIDATED: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  INTERVIEW_SCHEDULED: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  INTERVIEWED: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  ACCEPTED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  REJECTED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  IN_TRAINING: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  COMMISSION_ELIGIBLE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  COMMISSION_PAID: "bg-emerald-600 text-white dark:bg-emerald-500",
};

interface LeadStatusBadgeProps {
  status: LeadStatus;
}

export function LeadStatusBadge({ status }: LeadStatusBadgeProps) {
  const t = useTranslations("leads");

  return (
    <Badge variant="outline" className={STATUS_CLASSES[status]} aria-label={t(`status.${status}`)}>
      {t(`status.${status}`)}
    </Badge>
  );
}