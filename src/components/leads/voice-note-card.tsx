"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles, CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp,
  ExternalLink, Pencil, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { VoiceNote } from "@/generated/prisma/client";

const STATUS_CONFIG = {
  APPROVED: {
    label: "Approved",
    icon: CheckCircle2,
    className: "text-emerald-600",
  },
  REJECTED: {
    label: "Rejected",
    icon: XCircle,
    className: "text-destructive",
  },
  PENDING: {
    label: "Pending Review",
    icon: Clock,
    className: "text-amber-600",
  },
} as const;

const LEVEL_COLORS: Record<string, string> = {
  A2: "bg-red-100 text-red-700",
  B1: "bg-amber-100 text-amber-700",
  B2: "bg-blue-100 text-blue-700",
  C1: "bg-emerald-100 text-emerald-700",
  C2: "bg-purple-100 text-purple-700",
};

const SCORE_COLORS: Record<string, string> = {
  PASS: "bg-emerald-100 text-emerald-700",
  BORDERLINE: "bg-amber-100 text-amber-700",
  FAIL: "bg-red-100 text-red-700",
};

function formatDate(date: Date | null): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

interface Props {
  voiceNote: VoiceNote;
  isSuperAdmin: boolean;
}

export function VoiceNoteCard({ voiceNote: initial, isSuperAdmin }: Props) {
  const [vn, setVn] = useState<VoiceNote>(initial);
  const [expanded, setExpanded] = useState(false);
  const [assessing, setAssessing] = useState(false);
  const [assessError, setAssessError] = useState<string | null>(null);
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [overrideStatus, setOverrideStatus] = useState<string>(vn.validationStatus);
  const [overrideNotes, setOverrideNotes] = useState(vn.validatorNotes ?? "");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const statusCfg = STATUS_CONFIG[vn.validationStatus] ?? STATUS_CONFIG.PENDING;
  const StatusIcon = statusCfg.icon;
  const hasAI = !!vn.assessedAt;

  async function runAssessment() {
    setAssessing(true);
    setAssessError(null);
    try {
      const res = await fetch(`/api/voice-notes/${vn.id}/assess`, {
        method: "POST",
      });
      const data = await res.json() as { voiceNote?: VoiceNote; error?: string };
      if (!res.ok) {
        setAssessError(data.error ?? "Assessment failed");
      } else if (data.voiceNote) {
        setVn(data.voiceNote);
        setExpanded(true);
        router.refresh();
      }
    } finally {
      setAssessing(false);
    }
  }

  async function saveOverride() {
    setSaving(true);
    try {
      const res = await fetch(`/api/voice-notes/${vn.id}/override`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          validationStatus: overrideStatus,
          validatorNotes: overrideNotes || null,
        }),
      });
      const data = await res.json() as { voiceNote?: VoiceNote };
      if (res.ok && data.voiceNote) {
        setVn(data.voiceNote);
        setOverrideOpen(false);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg border bg-card text-sm">
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Status indicator */}
        <StatusIcon className={cn("h-4 w-4 shrink-0", statusCfg.className)} />

        {/* Language + score pill */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{vn.language}</span>
            {vn.englishLevel && (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-semibold",
                  LEVEL_COLORS[vn.englishLevel] ?? "bg-muted text-muted-foreground"
                )}
              >
                {vn.englishLevel}
              </span>
            )}
            {vn.overallScore && (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-semibold",
                  SCORE_COLORS[vn.overallScore] ?? "bg-muted text-muted-foreground"
                )}
              >
                {vn.overallScore}
              </span>
            )}
            <span className={cn("text-xs font-medium", statusCfg.className)}>
              {statusCfg.label}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
            {vn.duration && <span>{formatDuration(vn.duration)}</span>}
            {hasAI && <span>Assessed {formatDate(vn.assessedAt)}</span>}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {/* AI assess button */}
          {!hasAI && (
            <Button
              variant="outline"
              size="sm"
              onClick={runAssessment}
              disabled={assessing}
              title="Run AI Assessment"
            >
              {assessing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              <span className="ml-1 hidden sm:inline">Assess</span>
            </Button>
          )}
          {hasAI && !assessing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={runAssessment}
              disabled={assessing}
              title="Re-run AI Assessment"
            >
              <Sparkles className="h-3.5 w-3.5" />
            </Button>
          )}

          {/* Override button (admin only) */}
          {isSuperAdmin && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOverrideOpen((o) => !o)}
              title="Override decision"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}

          {/* Open file */}
          <a
            href={vn.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Open audio file"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>

          {/* Expand toggle (only if has AI data) */}
          {hasAI && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded((e) => !e)}
              title={expanded ? "Collapse" : "Show transcript"}
            >
              {expanded ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Assessment error */}
      {assessError && (
        <div className="border-t px-4 py-2 text-xs text-destructive bg-destructive/5">
          {assessError}
        </div>
      )}

      {/* Expanded AI details */}
      {expanded && hasAI && (
        <div className="border-t px-4 py-3 space-y-3">
          {vn.accentNotes && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Accent &amp; Fluency</p>
              <p className="text-sm">{vn.accentNotes}</p>
            </div>
          )}
          {vn.transcription && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Transcription</p>
              <p className="text-sm leading-relaxed bg-muted/40 rounded-md p-3 whitespace-pre-wrap">
                {vn.transcription}
              </p>
            </div>
          )}
          {vn.validatorNotes && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Reviewer Notes</p>
              <p className="text-sm italic text-muted-foreground">{vn.validatorNotes}</p>
            </div>
          )}
        </div>
      )}

      {/* Override panel */}
      {overrideOpen && isSuperAdmin && (
        <div className="border-t px-4 py-3 space-y-3 bg-muted/20">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Override Decision
          </p>
          <Select
            value={overrideStatus}
            onChange={(e) => setOverrideStatus(e.target.value)}
            className="w-44"
          >
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </Select>
          <Textarea
            placeholder="Reviewer notes (optional)…"
            value={overrideNotes}
            onChange={(e) => setOverrideNotes(e.target.value)}
            rows={2}
            className="text-sm"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={saveOverride} disabled={saving}>
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
              Save Override
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setOverrideOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
