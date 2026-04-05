import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireSuperAdmin } from "@/lib/auth-utils";
import { OfferForm } from "@/components/offers/offer-form";

export const metadata = { title: "New Offer | HR Recruitment System" };

export default async function NewOfferPage() {
  await requireSuperAdmin();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/offers"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to offers
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">New Offer</h1>
        <p className="text-sm text-muted-foreground">Fill in the details to create a new job offer.</p>
      </div>

      <OfferForm />
    </div>
  );
}
