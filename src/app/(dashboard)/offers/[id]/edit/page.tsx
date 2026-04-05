import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireSuperAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { OfferForm } from "@/components/offers/offer-form";

export const metadata = { title: "Edit Offer | HR Recruitment System" };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditOfferPage({ params }: PageProps) {
  await requireSuperAdmin();

  const { id } = await params;
  const offer = await prisma.offer.findUnique({ where: { id } });

  if (!offer) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href={`/offers/${offer.id}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to offer
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Edit Offer</h1>
        <p className="text-sm text-muted-foreground">{offer.company} — {offer.accountType}</p>
      </div>

      <OfferForm offer={offer} />
    </div>
  );
}
