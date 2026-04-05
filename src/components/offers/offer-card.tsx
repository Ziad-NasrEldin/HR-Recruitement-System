import Link from "next/link";
import { MapPin, Globe, Briefcase, Users, DollarSign } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { OfferStatusBadge } from "./offer-status-badge";
import type { Offer } from "@/generated/prisma/client";

interface SalaryDetails {
  min: number;
  max: number;
  currency: string;
}

interface OfferWithCount extends Offer {
  _count: { leads: number };
}

interface OfferCardProps {
  offer: OfferWithCount;
}

const WORK_MODEL_LABELS: Record<string, string> = {
  WFH: "Work From Home",
  ON_SITE: "On Site",
  HYBRID: "Hybrid",
};

export function OfferCard({ offer }: OfferCardProps) {
  const salary = offer.salaryDetails as SalaryDetails | null;

  return (
    <Link href={`/offers/${offer.id}`} className="block group">
      <Card className="h-full transition-shadow group-hover:ring-ring/30">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="line-clamp-1 text-base">{offer.company}</CardTitle>
            <OfferStatusBadge status={offer.status} />
          </div>
          <CardDescription className="line-clamp-1">{offer.accountType}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-2">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Globe className="h-3.5 w-3.5 shrink-0" />
            <span>{offer.language}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="line-clamp-1">{offer.location}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Briefcase className="h-3.5 w-3.5 shrink-0" />
            <span>{WORK_MODEL_LABELS[offer.workModel] ?? offer.workModel}</span>
          </div>
          {salary && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <DollarSign className="h-3.5 w-3.5 shrink-0" />
              <span>
                {salary.min.toLocaleString()} – {salary.max.toLocaleString()} {salary.currency}
              </span>
            </div>
          )}
        </CardContent>

        <CardFooter className="text-xs text-muted-foreground">
          <Users className="h-3.5 w-3.5 mr-1.5" />
          {offer._count.leads} candidate{offer._count.leads !== 1 ? "s" : ""}
        </CardFooter>
      </Card>
    </Link>
  );
}
