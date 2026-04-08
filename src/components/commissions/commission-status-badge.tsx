import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import type { CommissionStatus } from "@/types";

interface Props {
  status: CommissionStatus;
  className?: string;
}

export async function CommissionStatusBadge({ status, className }: Props) {
  const t = await getTranslations("commissions");
  
  const STATUS_CONFIG: Record<
    CommissionStatus,
    { labelKey: string; variant: "default" | "secondary" | "destructive" | "outline" }
  > = {
    PENDING: { labelKey: "PENDING", variant: "secondary" },
    ELIGIBLE: { labelKey: "ELIGIBLE", variant: "default" },
    PAID: { labelKey: "PAID", variant: "outline" },
  };

  const config = STATUS_CONFIG[status] ?? { labelKey: status, variant: "secondary" };
  return (
    <Badge variant={config.variant} className={className}>
      {t(`status.${config.labelKey}`)}
    </Badge>
  );
}
