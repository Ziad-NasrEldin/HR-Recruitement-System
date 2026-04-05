"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { LEAD_STATUS_ORDER, LEAD_STATUS_LABELS } from "@/types";
import type { LeadStatus } from "@/generated/prisma/client";

interface PipelineStageSelectorProps {
  leadId: string;
  currentStatus: LeadStatus;
}

// Statuses that are considered terminal (no further progression)
const TERMINAL_STATUSES: LeadStatus[] = ["ACCEPTED", "REJECTED", "COMMISSION_PAID"];

export function PipelineStageSelector({ leadId, currentStatus }: PipelineStageSelectorProps) {
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState<LeadStatus | "">("");
  const [interviewDate, setInterviewDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const currentIndex = LEAD_STATUS_ORDER.indexOf(currentStatus);

  const handleConfirm = async () => {
    if (!selectedStatus) return;
    if (selectedStatus === "INTERVIEW_SCHEDULED" && !interviewDate) {
      setError("Please pick an interview date/time.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/leads/${leadId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: selectedStatus,
          ...(interviewDate ? { interviewDate: new Date(interviewDate).toISOString() } : {}),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to update status.");
        return;
      }
      setOpen(false);
      setSelectedStatus("");
      setInterviewDate("");
      router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Visual pipeline track */}
      <div className="relative">
        <div className="flex items-center overflow-x-auto pb-2 gap-0">
          {LEAD_STATUS_ORDER.map((status, index) => {
            const isDone = index < currentIndex;
            const isCurrent = status === currentStatus;
            const isTerminal = TERMINAL_STATUSES.includes(status);
            const isRejected = status === "REJECTED";

            return (
              <div key={status} className="flex items-center shrink-0">
                <div
                  className={cn(
                    "flex flex-col items-center gap-1",
                    "w-[72px]"
                  )}
                >
                  <div
                    className={cn(
                      "h-3 w-3 rounded-full ring-2 transition-all",
                      isDone && !isRejected && "bg-primary ring-primary",
                      isDone && isRejected && "bg-destructive ring-destructive",
                      isCurrent && !isRejected && "bg-primary ring-primary ring-offset-2",
                      isCurrent && isRejected && "bg-destructive ring-destructive ring-offset-2",
                      !isDone && !isCurrent && "bg-muted ring-muted-foreground/30"
                    )}
                  />
                  <span
                    className={cn(
                      "text-[10px] text-center leading-tight max-w-[72px] px-0.5",
                      isCurrent ? "font-semibold text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {LEAD_STATUS_LABELS[status]}
                  </span>
                </div>
                {/* Connector line */}
                {index < LEAD_STATUS_ORDER.length - 1 && (
                  <div
                    className={cn(
                      "h-0.5 w-4 shrink-0",
                      index < currentIndex ? "bg-primary" : "bg-muted"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Change status section */}
      {!open ? (
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          Change Status
        </Button>
      ) : (
        <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
          <p className="text-sm font-medium">Change pipeline stage</p>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="new-status">New Status</Label>
            <Select
              id="new-status"
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value as LeadStatus);
                setError(null);
              }}
            >
              <option value="">— select —</option>
              {LEAD_STATUS_ORDER.map((status) => (
                <option key={status} value={status} disabled={status === currentStatus}>
                  {LEAD_STATUS_LABELS[status]}
                  {status === currentStatus ? " (current)" : ""}
                </option>
              ))}
            </Select>
          </div>

          {selectedStatus === "INTERVIEW_SCHEDULED" && (
            <div className="space-y-1.5">
              <Label htmlFor="interview-date">Interview Date & Time *</Label>
              <Input
                id="interview-date"
                type="datetime-local"
                value={interviewDate}
                onChange={(e) => setInterviewDate(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                required
              />
            </div>
          )}

          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleConfirm}
              disabled={!selectedStatus || loading}
            >
              {loading ? "Updating…" : "Confirm"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setOpen(false);
                setSelectedStatus("");
                setInterviewDate("");
                setError(null);
              }}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
