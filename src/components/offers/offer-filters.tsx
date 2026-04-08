"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export function OfferFilters() {
  const t = useTranslations("offers");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

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
    searchParams.has("status") ||
    searchParams.has("language") ||
    searchParams.has("workModel");

  const clearFilters = () => {
    router.push(pathname);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        className="w-36"
        value={searchParams.get("status") ?? ""}
        onChange={(e) => handleChange("status", e.target.value)}
        aria-label={t("aria.filterStatus")}
      >
        <option value="">{t("filters.allStatuses")}</option>
        <option value="ACTIVE">{t("status.ACTIVE")}</option>
        <option value="ON_HOLD">{t("status.ON_HOLD")}</option>
      </Select>

      <Input
        className="w-44"
        placeholder={t("filters.language")}
        defaultValue={searchParams.get("language") ?? ""}
        onBlur={(e) => handleChange("language", e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleChange("language", (e.target as HTMLInputElement).value);
          }
        }}
        aria-label={t("aria.filterLanguage")}
      />

      <Select
        className="w-40"
        value={searchParams.get("workModel") ?? ""}
        onChange={(e) => handleChange("workModel", e.target.value)}
        aria-label={t("aria.filterWorkModel")}
      >
        <option value="">{t("filters.allWorkModels")}</option>
        <option value="WFH">{t("workModel.WFH")}</option>
        <option value="ON_SITE">{t("workModel.ON_SITE")}</option>
        <option value="HYBRID">{t("workModel.HYBRID")}</option>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
          <X className="h-3.5 w-3.5" />
          {t("filters.clear")}
        </Button>
      )}
    </div>
  );
}
