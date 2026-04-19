"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export function ImportOffersButton() {
  const t = useTranslations("offers");
  const tErrors = useTranslations("errors");
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const router = useRouter();

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setMessage(null);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/offers/import", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: "error", text: tErrors("importFailed", { error: data.error }) });
        return;
      }

      setMessage({ type: "success", text: t("importSuccess", { count: data.created, skipped: data.skipped }) });
      router.refresh();
    } catch {
      setMessage({ type: "error", text: tErrors("networkError") });
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="inline-flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={handleFile}
        aria-label={t("form.importExcel")}
      />
      <Button
        variant="outline"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
      >
        <Upload className="size-4" />
        {loading ? t("form.importing") : t("form.importExcel")}
      </Button>
      {message && (
        <p className={`text-xs rounded-md px-3 py-1.5 ${message.type === "success" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400" : "bg-destructive/10 text-destructive"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
