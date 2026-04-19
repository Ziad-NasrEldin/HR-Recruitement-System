"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Lead, Offer } from "@/generated/prisma/client";

type OfferOption = Pick<Offer, "id" | "company" | "accountType" | "language">;

interface LeadFormProps {
  lead?: Lead;
  offers: OfferOption[];
}

export function LeadForm({ lead, offers }: LeadFormProps) {
  const router = useRouter();
  const t = useTranslations("leads");
  const tErrors = useTranslations("errors");
  const isEdit = !!lead;

  const [form, setForm] = useState({
    name: lead?.name ?? "",
    phone: lead?.phone ?? "",
    email: lead?.email ?? "",
    whatsappNumber: lead?.whatsappNumber ?? "",
    language: lead?.language ?? "",
    languageLevel: lead?.languageLevel ?? "",
    graduationStatus: lead?.graduationStatus ?? "",
    militaryStatus: lead?.militaryStatus ?? "",
    location: lead?.location ?? "",
    previousApplications: lead?.previousApplications ?? "",
    offerId: lead?.offerId ?? "",
    notes: lead?.notes ?? "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const url = isEdit ? `/api/leads/${lead.id}` : "/api/leads";
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? tErrors("somethingWentWrong"));
        return;
      }

      const data = await res.json();
      router.push(`/leads/${data.lead.id}`);
      router.refresh();
    } catch {
      setError(tErrors("networkError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Personal Info */}
      <Card>
        <CardHeader>
          <CardTitle>{t("form.personalInfo")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">{t("form.fullName")} *</Label>
            <Input
              id="name"
              value={form.name}
              onChange={set("name")}
              placeholder="Ahmed Mohamed"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">{t("form.phone")} *</Label>
            <Input
              id="phone"
              value={form.phone}
              onChange={set("phone")}
              placeholder="+20 1XX XXX XXXX"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">{t("form.email")}</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={set("email")}
              placeholder="candidate@email.com"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="whatsappNumber">{t("form.whatsapp")}</Label>
            <Input
              id="whatsappNumber"
              value={form.whatsappNumber}
              onChange={set("whatsappNumber")}
              placeholder="+20 1XX XXX XXXX"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="location">{t("form.location")} *</Label>
            <Input
              id="location"
              value={form.location}
              onChange={set("location")}
              placeholder="e.g. Cairo, Giza"
              required
            />
          </div>
        </CardContent>
      </Card>

      {/* Qualifications */}
      <Card>
        <CardHeader>
          <CardTitle>{t("form.qualifications")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="language">{t("form.language")} *</Label>
            <Input
              id="language"
              value={form.language}
              onChange={set("language")}
              placeholder="e.g. English"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="languageLevel">{t("form.languageLevel")}</Label>
            <Input
              id="languageLevel"
              value={form.languageLevel}
              onChange={set("languageLevel")}
              placeholder="e.g. B2, C1"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="graduationStatus">{t("form.graduationStatus")} *</Label>
            <Input
              id="graduationStatus"
              value={form.graduationStatus}
              onChange={set("graduationStatus")}
              placeholder="e.g. Graduate, Final Year"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="militaryStatus">{t("form.militaryStatus")}</Label>
            <Input
              id="militaryStatus"
              value={form.militaryStatus}
              onChange={set("militaryStatus")}
              placeholder="e.g. Exempted, Completed"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="previousApplications">{t("form.previousApps")}</Label>
            <Input
              id="previousApplications"
              value={form.previousApplications}
              onChange={set("previousApplications")}
              placeholder="e.g. Applied to Concentrix before"
            />
          </div>
        </CardContent>
      </Card>

      {/* Job Offer */}
      <Card>
        <CardHeader>
          <CardTitle>{t("form.linkedOffer")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            <Label htmlFor="offerId">{t("form.jobOffer")}</Label>
            <Select
              id="offerId"
              value={form.offerId}
              onChange={set("offerId")}
            >
              <option value="">{t("common.none")}</option>
              {offers.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.company} — {o.accountType} ({o.language})
                </option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>{t("form.notes")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            id="notes"
            value={form.notes}
            onChange={set("notes")}
            placeholder={t("form.notesPlaceholder")}
            rows={4}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.push("/leads")} disabled={loading}>
          {t("common.cancel")}
        </Button>
        <Button type="submit" disabled={loading}>
          {loading
            ? isEdit ? t("form.saving") : t("form.creating")
            : isEdit ? t("form.saveChanges") : t("addLead")
          }
        </Button>
      </div>
    </form>
  );
}