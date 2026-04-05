"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function ImportOffersButton() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/offers/import", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        alert(`Import failed: ${data.error}`);
        return;
      }

      alert(`Successfully imported ${data.created} offer${data.created !== 1 ? "s" : ""}${data.skipped > 0 ? ` (${data.skipped} skipped)` : ""}.`);
      router.refresh();
    } catch {
      alert("Import failed. Please try again.");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={handleFile}
      />
      <Button
        variant="outline"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
      >
        <Upload className="size-4" />
        {loading ? "Importing…" : "Import Excel"}
      </Button>
    </>
  );
}
