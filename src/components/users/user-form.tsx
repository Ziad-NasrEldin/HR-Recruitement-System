"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import type { User } from "@/generated/prisma/client";

type UserSubset = Pick<
  User,
  "id" | "name" | "email" | "role" | "isActive" | "trialEndsAt" | "accountExpiresAt"
>;

interface Props {
  user?: UserSubset;
}

function toDateInputValue(date: Date | null | undefined): string {
  if (!date) return "";
  return new Date(date).toISOString().split("T")[0];
}

export function UserForm({ user }: Props) {
  const t = useTranslations("settings");
  const tErrors = useTranslations("errors");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const isEditing = Boolean(user);

  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"RECRUITER" | "SUPER_ADMIN">(user?.role ?? "RECRUITER");
  const [isActive, setIsActive] = useState(user?.isActive ?? true);
  const [trialEndsAt, setTrialEndsAt] = useState(toDateInputValue(user?.trialEndsAt));
  const [accountExpiresAt, setAccountExpiresAt] = useState(
    toDateInputValue(user?.accountExpiresAt)
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const body: Record<string, unknown> = {
        name,
        email,
        role,
        isActive,
        trialEndsAt: trialEndsAt || null,
        accountExpiresAt: accountExpiresAt || null,
      };
      if (password) body.password = password;

      const url = isEditing ? `/api/users/${user!.id}` : "/api/users";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? tErrors("somethingWentWrong"));
        return;
      }

      router.push("/settings");
      router.refresh();
    } catch {
      setError(tErrors("networkError"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
      {/* Name */}
      <div className="space-y-1.5">
        <Label htmlFor="name">{t("form.fullName")}</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Jane Smith"
          required
        />
      </div>

      {/* Email */}
      <div className="space-y-1.5">
        <Label htmlFor="email">{t("form.email")}</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="jane@example.com"
          required
        />
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <Label htmlFor="password">
          {isEditing ? t("form.passwordHint") : t("form.password")}
        </Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={isEditing ? tCommon("newPassword") : "••••••••"}
          required={!isEditing}
          autoComplete="new-password"
        />
      </div>

      {/* Role */}
      <div className="space-y-1.5">
        <Label htmlFor="role">{t("form.role")}</Label>
        <Select
          id="role"
          value={role}
          onChange={(e) => setRole(e.target.value as typeof role)}
        >
          <option value="RECRUITER">{t("form.roleRecruiter")}</option>
          <option value="SUPER_ADMIN">{t("form.roleSuperAdmin")}</option>
        </Select>
      </div>

      {/* Active toggle (edit only) */}
      {isEditing && (
        <div className="space-y-1.5">
          <Label htmlFor="isActive">{t("form.accountStatus")}</Label>
          <Select
            id="isActive"
            value={isActive ? "true" : "false"}
            onChange={(e) => setIsActive(e.target.value === "true")}
          >
            <option value="true">{t("status.active")}</option>
            <option value="false">{t("status.inactive")}</option>
          </Select>
        </div>
      )}

      {/* Trial ends at */}
      <div className="space-y-1.5">
        <Label htmlFor="trialEndsAt">{t("form.trialEndsAt")}</Label>
        <Input
          id="trialEndsAt"
          type="date"
          value={trialEndsAt}
          onChange={(e) => setTrialEndsAt(e.target.value)}
        />
      </div>

      {/* Account expires at */}
      <div className="space-y-1.5">
        <Label htmlFor="accountExpiresAt">{t("form.expiresAt")}</Label>
        <Input
          id="accountExpiresAt"
          type="date"
          value={accountExpiresAt}
          onChange={(e) => setAccountExpiresAt(e.target.value)}
        />
      </div>

      {error && (
        <p className="text-sm text-destructive rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={saving}>
          {saving ? tCommon("save") : isEditing ? tCommon("save") : t("createUser")}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.push("/settings")}>
          {tCommon("cancel")}
        </Button>
      </div>
    </form>
  );
}
