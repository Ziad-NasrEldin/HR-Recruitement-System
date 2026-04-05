"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Offer } from "@/generated/prisma/client";

interface SalaryDetails {
  min: number;
  max: number;
  currency: string;
}

interface OfferFormProps {
  offer?: Offer;
}

export function OfferForm({ offer }: OfferFormProps) {
  const router = useRouter();
  const isEdit = !!offer;

  const salary = offer?.salaryDetails as SalaryDetails | null;

  const [form, setForm] = useState({
    company: offer?.company ?? "",
    language: offer?.language ?? "",
    accountType: offer?.accountType ?? "",
    graduationRequirement: offer?.graduationRequirement ?? "ANY",
    location: offer?.location ?? "",
    workModel: offer?.workModel ?? "ON_SITE",
    salaryMin: salary?.min?.toString() ?? "",
    salaryMax: salary?.max?.toString() ?? "",
    salaryCurrency: salary?.currency ?? "EGP",
    workingHours: offer?.workingHours ?? "",
    shift: offer?.shift ?? "",
    daysOff: offer?.daysOff ?? "",
    benefits: offer?.benefits ?? "",
    interviewProcess: offer?.interviewProcess ?? "",
    formLink: offer?.formLink ?? "",
    commissionAmount: offer?.commissionAmount ? offer.commissionAmount.toString() : "",
    commissionCurrency: (offer as (typeof offer & { commissionCurrency?: string }) | undefined)?.commissionCurrency ?? "EGP",
    commissionPeriodDays: offer?.commissionPeriodDays ? offer.commissionPeriodDays.toString() : "",
    requirements: offer?.requirements ?? "",
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

    const url = isEdit ? `/api/offers/${offer.id}` : "/api/offers";
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Something went wrong.");
        return;
      }

      const data = await res.json();
      router.push(`/offers/${data.offer.id}`);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
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

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="company">Company *</Label>
            <Input
              id="company"
              value={form.company}
              onChange={set("company")}
              placeholder="e.g. Accenture"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="accountType">Account Type *</Label>
            <Input
              id="accountType"
              value={form.accountType}
              onChange={set("accountType")}
              placeholder="e.g. Customer Service"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="language">Language *</Label>
            <Input
              id="language"
              value={form.language}
              onChange={set("language")}
              placeholder="e.g. English"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="location">Location *</Label>
            <Input
              id="location"
              value={form.location}
              onChange={set("location")}
              placeholder="e.g. Cairo, Egypt"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="workModel">Work Model *</Label>
            <Select id="workModel" value={form.workModel} onChange={set("workModel")} required>
              <option value="ON_SITE">On Site</option>
              <option value="WFH">Work From Home</option>
              <option value="HYBRID">Hybrid</option>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="graduationRequirement">Graduation Requirement</Label>
            <Select
              id="graduationRequirement"
              value={form.graduationRequirement}
              onChange={set("graduationRequirement")}
            >
              <option value="ANY">Any</option>
              <option value="GRADUATE">Graduate</option>
              <option value="UNDERGRADUATE">Undergraduate</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Schedule & Salary */}
      <Card>
        <CardHeader>
          <CardTitle>Schedule &amp; Compensation</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="workingHours">Working Hours *</Label>
            <Input
              id="workingHours"
              value={form.workingHours}
              onChange={set("workingHours")}
              placeholder="e.g. 8 hours/day"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="shift">Shift *</Label>
            <Input
              id="shift"
              value={form.shift}
              onChange={set("shift")}
              placeholder="e.g. Morning, Rotational"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="daysOff">Days Off *</Label>
            <Input
              id="daysOff"
              value={form.daysOff}
              onChange={set("daysOff")}
              placeholder="e.g. Friday & Saturday"
              required
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label>Salary Range *</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0"
                value={form.salaryMin}
                onChange={set("salaryMin")}
                placeholder="Min"
                required
                className="flex-1"
                aria-label="Salary minimum"
              />
              <span className="text-muted-foreground">–</span>
              <Input
                type="number"
                min="0"
                value={form.salaryMax}
                onChange={set("salaryMax")}
                placeholder="Max"
                required
                className="flex-1"
                aria-label="Salary maximum"
              />
              <Input
                value={form.salaryCurrency}
                onChange={set("salaryCurrency")}
                placeholder="EGP"
                className="w-20"
                aria-label="Currency"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Commission */}
      <Card>
        <CardHeader>
          <CardTitle>Commission</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="commissionAmount">Commission Amount</Label>
            <div className="flex items-center gap-2">
              <Input
                id="commissionAmount"
                type="number"
                min="0"
                step="0.01"
                value={form.commissionAmount}
                onChange={set("commissionAmount")}
                placeholder="e.g. 3000"
                className="flex-1"
              />
              <Select
                value={form.commissionCurrency}
                onChange={set("commissionCurrency")}
                className="w-24"
                aria-label="Commission currency"
              >
                <option value="EGP">EGP</option>
                <option value="USD">USD</option>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="commissionPeriodDays">Commission Period (days)</Label>
            <Input
              id="commissionPeriodDays"
              type="number"
              min="1"
              value={form.commissionPeriodDays}
              onChange={set("commissionPeriodDays")}
              placeholder="e.g. 90"
            />
          </div>
        </CardContent>
      </Card>

      {/* Details */}
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="benefits">Benefits *</Label>
            <Textarea
              id="benefits"
              value={form.benefits}
              onChange={set("benefits")}
              placeholder="List the benefits offered…"
              rows={3}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="interviewProcess">Interview Process *</Label>
            <Textarea
              id="interviewProcess"
              value={form.interviewProcess}
              onChange={set("interviewProcess")}
              placeholder="Describe the interview steps…"
              rows={3}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="requirements">Requirements</Label>
            <Textarea
              id="requirements"
              value={form.requirements}
              onChange={set("requirements")}
              placeholder="Additional requirements (optional)…"
              rows={3}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="formLink">Application Form Link</Label>
            <Input
              id="formLink"
              type="url"
              value={form.formLink}
              onChange={set("formLink")}
              placeholder="https://…"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (isEdit ? "Saving…" : "Creating…") : isEdit ? "Save Changes" : "Create Offer"}
        </Button>
      </div>
    </form>
  );
}
