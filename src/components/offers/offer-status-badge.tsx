import { Badge } from "@/components/ui/badge";
import type { OfferStatus } from "@/generated/prisma/client";

interface OfferStatusBadgeProps {
  status: OfferStatus;
}

export function OfferStatusBadge({ status }: OfferStatusBadgeProps) {
  if (status === "ACTIVE") {
    return (
      <Badge variant="default" className="bg-emerald-600 text-white dark:bg-emerald-500">
        Active
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="text-muted-foreground">
      On Hold
    </Badge>
  );
}
