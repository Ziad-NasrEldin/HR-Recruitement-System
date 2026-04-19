"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface Offer {
  id: string;
  company: string;
  accountType: string;
}

interface Recruiter {
  id: string;
  name: string;
}

interface Props {
  offers: Offer[];
  recruiters: Recruiter[];
  isSuperAdmin: boolean;
}

export function CommissionFilters({ offers, recruiters, isSuperAdmin }: Props) {
  const t = useTranslations("commissions");
  const router = useRouter();
  const searchParams = useSearchParams();

  const status = searchParams.get("status") ?? "";
  const offerId = searchParams.get("offerId") ?? "";
  const recruiterId = searchParams.get("recruiterId") ?? "";
  const dateFrom = searchParams.get("dateFrom") ?? "";
  const dateTo = searchParams.get("dateTo") ?? "";

  const buildUrl = useCallback(
    (updates: Record<string, string>) => {
      const sp = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          sp.set(key, value);
        } else {
          sp.delete(key);
        }
      }
      sp.delete("page");
      return `/commissions?${sp.toString()}`;
    },
    [searchParams]
  );

  const hasFilters = status || offerId || recruiterId || dateFrom || dateTo;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Status */}
      <Select
        className="w-36"
        value={status}
        onChange={(e) => router.push(buildUrl({ status: e.target.value }))}
        aria-label={t("filters.allStatuses")}
      >
        <option value="">{t("filters.allStatuses")}</option>
        <option value="PENDING">{t("status.PENDING")}</option>
        <option value="ELIGIBLE">{t("status.ELIGIBLE")}</option>
        <option value="PAID">{t("status.PAID")}</option>
      </Select>

      {/* Offer */}
      <Select
        className="w-44"
        value={offerId}
        onChange={(e) => router.push(buildUrl({ offerId: e.target.value }))}
      >
        <option value="">{t("filters.allOffers")}</option>
        {offers.map((o) => (
          <option key={o.id} value={o.id}>
            {o.company} — {o.accountType}
          </option>
        ))}
      </Select>

      {/* Recruiter (admin only) */}
      {isSuperAdmin && (
        <Select
          className="w-44"
          value={recruiterId}
          onChange={(e) => router.push(buildUrl({ recruiterId: e.target.value }))}
        >
          <option value="">{t("filters.allRecruiters")}</option>
          {recruiters.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </Select>
      )}

      {/* Date range */}
      <Input
        type="date"
        className="w-36"
        value={dateFrom}
        onChange={(e) => router.push(buildUrl({ dateFrom: e.target.value }))}
        aria-label={t("filters.fromDate")}
      />
      <Input
        type="date"
        className="w-36"
        value={dateTo}
        onChange={(e) => router.push(buildUrl({ dateTo: e.target.value }))}
        aria-label={t("filters.toDate")}
      />

      {/* Clear */}
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={() => router.push("/commissions")}>
          <X className="h-4 w-4 mr-1" />
          {t("filters.clear")}
        </Button>
      )}
    </div>
  );
}
