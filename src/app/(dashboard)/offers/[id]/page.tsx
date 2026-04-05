import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Pencil, Globe, MapPin, Briefcase, Clock, Calendar, Users, DollarSign, BadgeCheck, FileText } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OfferStatusBadge } from "@/components/offers/offer-status-badge";
import { ToggleStatusButton } from "./toggle-status-button";

export const metadata = { title: "Offer Detail | HR Recruitment System" };

interface PageProps {
  params: Promise<{ id: string }>;
}

interface SalaryDetails {
  min: number;
  max: number;
  currency: string;
}

const WORK_MODEL_LABELS: Record<string, string> = {
  WFH: "Work From Home",
  ON_SITE: "On Site",
  HYBRID: "Hybrid",
};

const GRAD_REQ_LABELS: Record<string, string> = {
  ANY: "Any",
  GRADUATE: "Graduate",
  UNDERGRADUATE: "Undergraduate",
};

export default async function OfferDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();
  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";

  const offer = await prisma.offer.findUnique({
    where: { id },
    include: { _count: { select: { leads: true } } },
  });

  if (!offer) notFound();

  const salary = offer.salaryDetails as SalaryDetails | null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Back + Actions */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/offers"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to offers
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{offer.company}</h1>
            <OfferStatusBadge status={offer.status} />
          </div>
          <p className="text-muted-foreground mt-0.5">{offer.accountType}</p>
        </div>

        {isSuperAdmin && (
          <div className="flex shrink-0 items-center gap-2">
            <ToggleStatusButton offerId={offer.id} currentStatus={offer.status} />
            <Link href={`/offers/${offer.id}/edit`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              <Pencil className="h-3.5 w-3.5 mr-1" />
              Edit
            </Link>
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { icon: Globe, label: "Language", value: offer.language },
          { icon: Briefcase, label: "Work Model", value: WORK_MODEL_LABELS[offer.workModel] ?? offer.workModel },
          { icon: MapPin, label: "Location", value: offer.location },
          { icon: Users, label: "Candidates", value: String(offer._count.leads) },
        ].map(({ icon: Icon, label, value }) => (
          <Card key={label} size="sm">
            <CardContent className="flex flex-col gap-0.5 pt-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Icon className="h-3.5 w-3.5" />
                {label}
              </div>
              <p className="text-sm font-medium">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Schedule & Compensation */}
      <Card>
        <CardHeader>
          <CardTitle>Schedule &amp; Compensation</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 text-sm">
          <div className="flex gap-2">
            <Clock className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-muted-foreground text-xs">Working Hours</p>
              <p>{offer.workingHours}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Clock className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-muted-foreground text-xs">Shift</p>
              <p>{offer.shift}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Calendar className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-muted-foreground text-xs">Days Off</p>
              <p>{offer.daysOff}</p>
            </div>
          </div>
          {salary && (
            <div className="flex gap-2">
              <DollarSign className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-muted-foreground text-xs">Salary</p>
                <p>
                  {salary.min.toLocaleString()} – {salary.max.toLocaleString()} {salary.currency}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Commission */}
      <Card>
        <CardHeader>
          <CardTitle>Commission</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 text-sm">
          <div className="flex gap-2">
            <DollarSign className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-muted-foreground text-xs">Amount</p>
              <p>{offer.commissionAmount.toLocaleString()} EGP</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Calendar className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-muted-foreground text-xs">Period</p>
              <p>{offer.commissionPeriodDays} days</p>
            </div>
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <BadgeCheck className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-muted-foreground text-xs">Graduation Requirement</p>
              <p>{GRAD_REQ_LABELS[offer.graduationRequirement] ?? offer.graduationRequirement}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details */}
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Benefits</p>
            <p className="whitespace-pre-wrap">{offer.benefits}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Interview Process</p>
            <p className="whitespace-pre-wrap">{offer.interviewProcess}</p>
          </div>
          {offer.requirements && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Requirements</p>
              <p className="whitespace-pre-wrap">{offer.requirements}</p>
            </div>
          )}
          {offer.formLink && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Application Form</p>
              <a
                href={offer.formLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary underline underline-offset-4 hover:no-underline"
              >
                <FileText className="h-3.5 w-3.5" />
                Open form
              </a>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
