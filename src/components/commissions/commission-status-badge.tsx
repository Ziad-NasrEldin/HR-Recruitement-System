import { Badge } from "@/components/ui/badge";
import type { CommissionStatus } from "@/types";

const STATUS_CONFIG: Record<
  CommissionStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  PENDING: { label: "Pending", variant: "secondary" },
  ELIGIBLE: { label: "Eligible", variant: "default" },
  PAID: { label: "Paid", variant: "outline" },
};

interface Props {
  status: CommissionStatus;
  className?: string;
}

export function CommissionStatusBadge({ status, className }: Props) {
  const config = STATUS_CONFIG[status] ?? { label: status, variant: "secondary" };
  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}
