"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
        setError(data.error ?? "Something went wrong.");
        return;
      }

      const data = await res.json();
      router.push(`/leads/${data.lead.id}`);
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

      {/* Personal Info */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={form.name}
              onChange={set("name")}
              placeholder="Ahmed Mohamed"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone *</Label>
            <Input
              id="phone"
              value={form.phone}
              onChange={set("phone")}
              placeholder="+20 1XX XXX XXXX"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={set("email")}
              placeholder="candidate@email.com"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
            <Input
              id="whatsappNumber"
              value={form.whatsappNumber}
              onChange={set("whatsappNumber")}
              placeholder="+20 1XX XXX XXXX"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="location">Location *</Label>
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
          <CardTitle>Qualifications</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
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
            <Label htmlFor="languageLevel">Language Level</Label>
            <Input
              id="languageLevel"
              value={form.languageLevel}
              onChange={set("languageLevel")}
              placeholder="e.g. B2, C1"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="graduationStatus">Graduation Status *</Label>
            <Input
              id="graduationStatus"
              value={form.graduationStatus}
              onChange={set("graduationStatus")}
              placeholder="e.g. Graduate, Final Year"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="militaryStatus">Military Status</Label>
            <Input
              id="militaryStatus"
              value={form.militaryStatus}
              onChange={set("militaryStatus")}
              placeholder="e.g. Exempted, Completed"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="previousApplications">Previous Applications</Label>
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
          <CardTitle>Linked Offer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            <Label htmlFor="offerId">Job Offer</Label>
            <Select
              id="offerId"
              value={form.offerId}
              onChange={set("offerId")}
            >
              <option value="">None</option>
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
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            id="notes"
            value={form.notes}
            onChange={set("notes")}
            placeholder="Any additional notes about this candidate…"
            rows={4}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading
            ? isEdit ? "Saving…" : "Creating…"
            : isEdit ? "Save Changes" : "Add Lead"
          }
        </Button>
      </div>
    </form>
  );
}
