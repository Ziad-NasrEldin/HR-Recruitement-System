"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";

interface VoiceNoteUploaderProps {
  leadId: string;
}

export function VoiceNoteUploader({ leadId }: VoiceNoteUploaderProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [fileUrl, setFileUrl] = useState("");
  const [language, setLanguage] = useState("");
  const [duration, setDuration] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setFileUrl("");
    setLanguage("");
    setDuration("");
    setError(null);
    setOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileUrl || !language) {
      setError("URL and language are required.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/leads/${leadId}/voice-notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileUrl,
          language,
          ...(duration ? { duration: parseInt(duration, 10) } : {}),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to add voice note.");
        return;
      }
      reset();
      router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-1">
        <Plus className="h-3.5 w-3.5" />
        Add Voice Note
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border bg-muted/30 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Add Voice Note</p>
        <button type="button" onClick={reset} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="space-y-1.5">
        <Label htmlFor="vn-url">File URL *</Label>
        <Input
          id="vn-url"
          type="url"
          placeholder="https://…"
          value={fileUrl}
          onChange={(e) => setFileUrl(e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="vn-lang">Language *</Label>
          <Input
            id="vn-lang"
            placeholder="e.g. English"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="vn-duration">Duration (seconds)</Label>
          <Input
            id="vn-duration"
            type="number"
            min="1"
            placeholder="e.g. 120"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={loading}>
          {loading ? "Saving…" : "Save"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={reset} disabled={loading}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
