import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LeadForm } from "@/components/leads/lead-form";

export const metadata = { title: "Edit Lead | HR Recruitment System" };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditLeadPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user) redirect("/login");

  const [lead, offers] = await Promise.all([
    prisma.lead.findUnique({ where: { id } }),
    prisma.offer.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, company: true, accountType: true, language: true },
      orderBy: { company: "asc" },
    }),
  ]);

  if (!lead) notFound();

  // Recruiters can only edit their own leads
  if (session.user.role === "RECRUITER" && lead.recruiterId !== session.user.id) {
    redirect("/leads");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href={`/leads/${lead.id}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to lead
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Edit Lead</h1>
        <p className="text-sm text-muted-foreground">{lead.name}</p>
      </div>

      <LeadForm lead={lead} offers={offers} />
    </div>
  );
}
