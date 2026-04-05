import Link from "next/link";
import { Phone, Globe, Briefcase, User } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { LeadStatusBadge } from "./lead-status-badge";
import type { Lead, Offer, User as UserModel } from "@/generated/prisma/client";

interface LeadWithRelations extends Lead {
  recruiter: Pick<UserModel, "id" | "name">;
  offer: Pick<Offer, "id" | "company" | "accountType" | "language"> | null;
}

interface LeadCardProps {
  lead: LeadWithRelations;
  showRecruiter?: boolean;
}

export function LeadCard({ lead, showRecruiter = false }: LeadCardProps) {
  return (
    <Link href={`/leads/${lead.id}`} className="block group">
      <Card className="h-full transition-shadow group-hover:ring-ring/30">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="line-clamp-1 text-base">{lead.name}</CardTitle>
            <LeadStatusBadge status={lead.status} />
          </div>
          {lead.offer && (
            <CardDescription className="line-clamp-1">
              {lead.offer.company} — {lead.offer.accountType}
            </CardDescription>
          )}
        </CardHeader>

        <CardContent className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Phone className="h-3.5 w-3.5 shrink-0" />
            <span>{lead.phone}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Globe className="h-3.5 w-3.5 shrink-0" />
            <span>
              {lead.language}
              {lead.languageLevel ? ` · ${lead.languageLevel}` : ""}
            </span>
          </div>
          {lead.offer && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Briefcase className="h-3.5 w-3.5 shrink-0" />
              <span className="line-clamp-1">{lead.offer.language}</span>
            </div>
          )}
        </CardContent>

        {showRecruiter && (
          <CardFooter className="text-xs text-muted-foreground">
            <User className="h-3.5 w-3.5 mr-1.5" />
            {lead.recruiter.name}
          </CardFooter>
        )}
      </Card>
    </Link>
  );
}
