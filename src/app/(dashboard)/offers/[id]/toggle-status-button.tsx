"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { OfferStatus } from "@/generated/prisma/client";

interface ToggleStatusButtonProps {
  offerId: string;
  currentStatus: OfferStatus;
}

export function ToggleStatusButton({ offerId, currentStatus }: ToggleStatusButtonProps) {
  const t = useTranslations("offers");
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const isActive = currentStatus === "ACTIVE";

  const handleToggle = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/offers/${offerId}/status`, { method: "PATCH" });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={isActive ? "secondary" : "default"}
      size="sm"
      onClick={handleToggle}
      disabled={loading}
    >
      {loading ? t("form.updating") : isActive ? t("form.setOnHold") : t("form.setActive")}
    </Button>
  );
}
