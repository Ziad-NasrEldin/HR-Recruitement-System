import Link from "next/link";
import { Plus } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { OfferCard } from "@/components/offers/offer-card";
import { OfferFilters } from "@/components/offers/offer-filters";
import { ImportOffersButton } from "@/components/offers/import-offers-button";
import type { OfferStatus, WorkModel } from "@/generated/prisma/client";

export const metadata = { title: "Offers | HR Recruitment System" };

interface PageProps {
  searchParams: Promise<{ status?: string; language?: string; workModel?: string; page?: string }>;
}

export default async function OffersPage({ searchParams }: PageProps) {
  const session = await auth();
  const params = await searchParams;

  const status = params.status as OfferStatus | undefined;
  const language = params.language;
  const workModel = params.workModel as WorkModel | undefined;
  const page = parseInt(params.page ?? "1", 10);
  const limit = 12;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (language) where.language = { contains: language, mode: "insensitive" };
  if (workModel) where.workModel = workModel;

  const [offers, total] = await Promise.all([
    prisma.offer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: { _count: { select: { leads: true } } },
    }),
    prisma.offer.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);
  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Offers</h1>
          <p className="text-sm text-muted-foreground">
            {total} offer{total !== 1 ? "s" : ""} found
          </p>
        </div>
        {isSuperAdmin && (
          <div className="flex items-center gap-2">
            <ImportOffersButton />
            <Link href="/offers/new" className={cn(buttonVariants())}>
              <Plus className="h-4 w-4" />
              New Offer
            </Link>
          </div>
        )}
      </div>

      {/* Filters */}
      <OfferFilters />

      {/* Grid */}
      {offers.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <p className="text-muted-foreground">No offers match your filters.</p>
          {isSuperAdmin && (
            <Link href="/offers/new" className={cn(buttonVariants({ variant: "outline" }), "mt-4")}>
              Create your first offer
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {offers.map((offer) => (
            <OfferCard key={offer.id} offer={offer} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {page > 1 && (
            <Link
              href={`/offers?${new URLSearchParams({
                ...(status ? { status } : {}),
                ...(language ? { language } : {}),
                ...(workModel ? { workModel } : {}),
                page: String(page - 1),
              }).toString()}`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Previous
            </Link>
          )}
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/offers?${new URLSearchParams({
                ...(status ? { status } : {}),
                ...(language ? { language } : {}),
                ...(workModel ? { workModel } : {}),
                page: String(page + 1),
              }).toString()}`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
