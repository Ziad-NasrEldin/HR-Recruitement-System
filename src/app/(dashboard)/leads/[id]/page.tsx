import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  ChevronLeft, Pencil, Phone, Mail, MessageCircle, Globe,
  GraduationCap, Shield, MapPin, Briefcase, FileText, DollarSign, Calendar,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LeadStatusBadge } from "@/components/leads/lead-status-badge";
import { PipelineStageSelector } from "@/components/leads/pipeline-stage-selector";
import { VoiceNoteUploader } from "@/components/leads/voice-note-uploader";
import { VoiceNoteCard } from "@/components/leads/voice-note-card";
import { LeadTimeline } from "@/components/leads/lead-timeline";

export const metadata = { title: "Lead Detail | HR Recruitment System" };

interface PageProps {
  params: Promise<{ id: string }>;
}

function formatDate(date: Date | null) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-EG", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(date)
  );
}

export default async function LeadDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();
  const t = await getTranslations("leads");

  const lead = await prisma.lead.findUnique({
    where: { id },
    include: {
      recruiter: { select: { id: true, name: true, email: true } },
      offer: {
        select: {
          id: true,
          company: true,
          accountType: true,
          language: true,
          commissionAmount: true,
          commissionPeriodDays: true,
        },
      },
      voiceNotes: { orderBy: { createdAt: "asc" } },
      followUpReminders: { orderBy: { dueDate: "asc" } },
      commission: true,
    },
  });

  if (!lead) notFound();

  if (session?.user?.role === "RECRUITER" && lead.recruiterId !== session.user.id) {
    redirect("/leads");
  }

  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";

  const profile = [
    { icon: Phone, label: t("form.phone"), value: lead.phone },
    { icon: Mail, label: t("form.email"), value: lead.email ?? "—" },
    { icon: MessageCircle, label: t("form.whatsapp"), value: lead.whatsappNumber ?? "—" },
    { icon: Globe, label: t("form.language"), value: lead.languageLevel ? `${lead.language} · ${lead.languageLevel}` : lead.language },
    { icon: GraduationCap, label: t("form.graduationStatus"), value: lead.graduationStatus },
    { icon: Shield, label: t("form.militaryStatus"), value: lead.militaryStatus ?? "—" },
    { icon: MapPin, label: t("form.location"), value: lead.location },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/leads"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
          >
            <ChevronLeft className="h-4 w-4" />
            {t("backToLeads")}
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{lead.name}</h1>
            <LeadStatusBadge status={lead.status} />
          </div>
          {lead.offer && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {lead.offer.company} — {lead.offer.accountType}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            {t("detail.recruiter")}: {lead.recruiter.name}
          </p>
        </div>
        <Link
          href={`/leads/${lead.id}/edit`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "shrink-0")}
        >
          <Pencil className="h-3.5 w-3.5 mr-1" />
          {t("editLead")}
        </Link>
      </div>

      {/* Pipeline */}
      <Card>
        <CardHeader>
          <CardTitle>{t("detail.pipelineStage")}</CardTitle>
        </CardHeader>
        <CardContent>
          <PipelineStageSelector leadId={lead.id} currentStatus={lead.status} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column: Profile + Offer */}
        <div className="space-y-6 lg:col-span-1">
          {/* Profile */}
          <Card>
            <CardHeader>
              <CardTitle>{t("detail.profile")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {profile.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex gap-2 text-sm">
                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="break-words">{value}</p>
                  </div>
                </div>
              ))}
              {lead.previousApplications && (
                <div className="flex gap-2 text-sm">
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t("detail.previousApplications")}</p>
                    <p>{lead.previousApplications}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Linked Offer */}
          {lead.offer && (
            <Card>
              <CardHeader>
                <CardTitle>{t("detail.linkedOffer")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex gap-2">
                  <Briefcase className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t("detail.linkedOffer")}</p>
                    <Link
                      href={`/offers/${lead.offer.id}`}
                      className="text-primary hover:underline"
                    >
                      {lead.offer.company} — {lead.offer.accountType}
                    </Link>
                  </div>
                </div>
                <div className="flex gap-2">
                  <DollarSign className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t("detail.commission")}</p>
                    <p>{lead.offer.commissionAmount.toLocaleString()} EGP / {lead.offer.commissionPeriodDays} days</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Key Dates */}
          <Card>
            <CardHeader>
              <CardTitle>{t("detail.keyDates")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {[
                { icon: Calendar, label: "Interview", value: lead.interviewDate },
                { icon: Calendar, label: "Training Start", value: lead.trainingStartDate },
                { icon: Calendar, label: "Commission Eligible", value: lead.commissionEligibleDate },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex gap-2">
                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p>{formatDate(value)}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Commission */}
          {lead.commission && (
            <Card>
              <CardHeader>
                <CardTitle>{t("detail.commission")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex gap-2">
                  <DollarSign className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t("detail.commission")}</p>
                    <p>{lead.commission.amount.toLocaleString()} EGP</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t("leads.status")}</p>
                  <p className="font-medium capitalize">{lead.commission.status.toLowerCase()}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column: Activity + Notes */}
        <div className="space-y-6 lg:col-span-2">
          {/* Voice Notes */}
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>{t("detail.voiceNotes")}</CardTitle>
              <VoiceNoteUploader leadId={lead.id} />
            </CardHeader>
            <CardContent>
              {lead.voiceNotes.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("detail.noVoiceNotes")}</p>
              ) : (
                <div className="space-y-3">
                  {lead.voiceNotes.map((vn) => (
                    <VoiceNoteCard
                      key={vn.id}
                      voiceNote={vn}
                      isSuperAdmin={isSuperAdmin}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline (Reminders) */}
          <Card>
            <CardHeader>
              <CardTitle>{t("detail.followUpTimeline")}</CardTitle>
            </CardHeader>
            <CardContent>
              <LeadTimeline
                voiceNotes={[]}
                reminders={lead.followUpReminders}
              />
            </CardContent>
          </Card>

          {/* Notes */}
          {lead.notes && (
            <Card>
              <CardHeader>
                <CardTitle>{t("detail.notes")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{lead.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}