"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export function OfferFilters() {
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
      // reset to page 1 on filter change
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
        aria-label="Filter by status"
      >
        <option value="">All statuses</option>
        <option value="ACTIVE">Active</option>
        <option value="ON_HOLD">On Hold</option>
      </Select>

      <Input
        className="w-44"
        placeholder="Language…"
        defaultValue={searchParams.get("language") ?? ""}
        onBlur={(e) => handleChange("language", e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleChange("language", (e.target as HTMLInputElement).value);
          }
        }}
        aria-label="Filter by language"
      />

      <Select
        className="w-40"
        value={searchParams.get("workModel") ?? ""}
        onChange={(e) => handleChange("workModel", e.target.value)}
        aria-label="Filter by work model"
      >
        <option value="">All work models</option>
        <option value="WFH">Work From Home</option>
        <option value="ON_SITE">On Site</option>
        <option value="HYBRID">Hybrid</option>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
          <X className="h-3.5 w-3.5" />
          Clear
        </Button>
      )}
    </div>
  );
}
