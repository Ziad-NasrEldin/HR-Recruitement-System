"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { LEAD_STATUS_LABELS } from "@/types";
import type { Offer, User } from "@/generated/prisma/client";

type OfferOption = Pick<Offer, "id" | "company" | "accountType">;
type UserOption = Pick<User, "id" | "name">;

interface LeadFiltersProps {
  offers: OfferOption[];
  recruiters?: UserOption[];
  isSuperAdmin?: boolean;
}

export function LeadFilters({ offers, recruiters = [], isSuperAdmin = false }: LeadFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations("leads");

  const createQueryString = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      params.delete("page");
      return params.toString();
    },
    [searchParams]
  );

  const handleChange = (key: string, value: string) => {
    const qs = createQueryString({ [key]: value || null });
    router.push(`${pathname}?${qs}`);
  };

  const hasFilters =
    searchParams.has("search") ||
    searchParams.has("status") ||
    searchParams.has("offerId") ||
    searchParams.has("recruiterId") ||
    searchParams.has("dateFrom") ||
    searchParams.has("dateTo");

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        className="w-48"
        placeholder={t("search.placeholder")}
        defaultValue={searchParams.get("search") ?? ""}
        onBlur={(e) => handleChange("search", e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleChange("search", (e.target as HTMLInputElement).value);
        }}
        aria-label={t("aria.searchLeads")}
      />

      <Select
        className="w-44"
        value={searchParams.get("status") ?? ""}
        onChange={(e) => handleChange("status", e.target.value)}
        aria-label={t("aria.filterStatus")}
      >
        <option value="">{t("filters.allStatuses")}</option>
        {Object.entries(LEAD_STATUS_LABELS).map(([value, _]) => (
          <option key={value} value={value}>{t(`status.${value}`)}</option>
        ))}
      </Select>

      <Select
        className="w-48"
        value={searchParams.get("offerId") ?? ""}
        onChange={(e) => handleChange("offerId", e.target.value)}
        aria-label={t("aria.filterOffer")}
      >
        <option value="">{t("filters.allOffers")}</option>
        {offers.map((o) => (
          <option key={o.id} value={o.id}>{o.company} — {o.accountType}</option>
        ))}
      </Select>

      {isSuperAdmin && recruiters.length > 0 && (
        <Select
          className="w-40"
          value={searchParams.get("recruiterId") ?? ""}
          onChange={(e) => handleChange("recruiterId", e.target.value)}
          aria-label={t("aria.filterRecruiter")}
        >
          <option value="">{t("filters.allRecruiters")}</option>
          {recruiters.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </Select>
      )}

      <Input
        type="date"
        className="w-40"
        value={searchParams.get("dateFrom") ?? ""}
        onChange={(e) => handleChange("dateFrom", e.target.value)}
        aria-label={t("filters.fromDate")}
      />
      <Input
        type="date"
        className="w-40"
        value={searchParams.get("dateTo") ?? ""}
        onChange={(e) => handleChange("dateTo", e.target.value)}
        aria-label={t("filters.toDate")}
      />

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={() => router.push(pathname)} className="gap-1">
          <X className="h-3.5 w-3.5" />
          {t("clear")}
        </Button>
      )}
    </div>
  );
}