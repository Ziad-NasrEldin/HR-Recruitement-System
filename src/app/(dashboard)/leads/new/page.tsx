import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { LeadForm } from "@/components/leads/lead-form";

export const metadata = { title: "Add Lead | HR Recruitment System" };

export default async function NewLeadPage() {
  await requireAuth();

  const offers = await prisma.offer.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, company: true, accountType: true, language: true },
    orderBy: { company: "asc" },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/leads"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to leads
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Add Lead</h1>
        <p className="text-sm text-muted-foreground">Register a new candidate in the pipeline.</p>
      </div>

      <LeadForm offers={offers} />
    </div>
  );
}
