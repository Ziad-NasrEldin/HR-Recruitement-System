import Link from "next/link";
import { Plus } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button-variants";
import { LeadCard } from "@/components/leads/lead-card";
import { LeadFilters } from "@/components/leads/lead-filters";
import type { LeadStatus } from "@/generated/prisma/client";

export const metadata = { title: "Leads | HR Recruitment System" };

interface PageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    offerId?: string;
    recruiterId?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: string;
  }>;
}

export default async function LeadsPage({ searchParams }: PageProps) {
  const session = await auth();
  const params = await searchParams;

  const search = params.search;
  const status = params.status as LeadStatus | undefined;
  const offerId = params.offerId;
  const recruiterParam = params.recruiterId;
  const dateFrom = params.dateFrom;
  const dateTo = params.dateTo;
  const page = parseInt(params.page ?? "1", 10);
  const limit = 20;
  const skip = (page - 1) * limit;

  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";

  const where: Record<string, unknown> = {};

  if (!isSuperAdmin) {
    where.recruiterId = session?.user?.id;
  } else if (recruiterParam) {
    where.recruiterId = recruiterParam;
  }

  if (status) where.status = status;
  if (offerId) where.offerId = offerId;

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
    ];
  }

  if (dateFrom || dateTo) {
    where.createdAt = {
      ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
      ...(dateTo ? { lte: new Date(dateTo) } : {}),
    };
  }

  const [leads, total, offers, recruiters] = await Promise.all([
    prisma.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        recruiter: { select: { id: true, name: true } },
        offer: { select: { id: true, company: true, accountType: true, language: true } },
      },
    }),
    prisma.lead.count({ where }),
    prisma.offer.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, company: true, accountType: true },
      orderBy: { company: "asc" },
    }),
    isSuperAdmin
      ? prisma.user.findMany({
          where: { role: "RECRUITER" },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
  ]);

  const totalPages = Math.ceil(total / limit);

  const buildPageUrl = (p: number) => {
    const sp = new URLSearchParams({
      ...(search ? { search } : {}),
      ...(status ? { status } : {}),
      ...(offerId ? { offerId } : {}),
      ...(recruiterParam ? { recruiterId: recruiterParam } : {}),
      ...(dateFrom ? { dateFrom } : {}),
      ...(dateTo ? { dateTo } : {}),
      page: String(p),
    });
    return `/leads?${sp.toString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leads</h1>
          <p className="text-sm text-muted-foreground">
            {total} candidate{total !== 1 ? "s" : ""} found
          </p>
        </div>
        <Link href="/leads/new" className={cn(buttonVariants())}>
          <Plus className="h-4 w-4" />
          Add Lead
        </Link>
      </div>

      {/* Filters */}
      <LeadFilters
        offers={offers}
        recruiters={recruiters}
        isSuperAdmin={isSuperAdmin}
      />

      {/* Grid */}
      {leads.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <p className="text-muted-foreground">No leads match your filters.</p>
          <Link href="/leads/new" className={cn(buttonVariants({ variant: "outline" }), "mt-4")}>
            Add your first lead
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} showRecruiter={isSuperAdmin} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {page > 1 && (
            <Link href={buildPageUrl(page - 1)} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              Previous
            </Link>
          )}
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link href={buildPageUrl(page + 1)} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
