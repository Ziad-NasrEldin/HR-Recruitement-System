import { Badge } from "@/components/ui/badge";

interface Props {
  isActive: boolean;
  trialEndsAt?: Date | null;
  accountExpiresAt?: Date | null;
}

export function UserStatusBadge({ isActive, trialEndsAt, accountExpiresAt }: Props) {
  if (!isActive) {
    return <Badge variant="destructive">Inactive</Badge>;
  }

  const now = new Date();

  if (accountExpiresAt && new Date(accountExpiresAt) < now) {
    return <Badge variant="destructive">Expired</Badge>;
  }

  if (trialEndsAt) {
    const trialEnd = new Date(trialEndsAt);
    if (trialEnd < now) {
      return <Badge variant="destructive">Trial Ended</Badge>;
    }
    const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return (
      <Badge variant="secondary">
        Trial · {daysLeft}d left
      </Badge>
    );
  }

  return <Badge variant="default">Active</Badge>;
}
