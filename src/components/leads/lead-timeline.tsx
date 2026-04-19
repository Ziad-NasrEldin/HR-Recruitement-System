import { getTranslations, getLocale } from "next-intl/server";
import { Mic, Bell, BellOff, CheckCircle2 } from "lucide-react";
import { cn, formatDateTime } from "@/lib/utils";
import type { VoiceNote, FollowUpReminder } from "@/generated/prisma/client";

const REMINDER_TYPE_KEYS: Record<string, string> = {
  PRE_INTERVIEW: "preInterview",
  POST_INTERVIEW: "postInterview",
  DAY_10: "day10",
  DAY_15: "day15",
  DAY_30: "day30",
};

const VALIDATION_KEYS: Record<string, string> = {
  PENDING: "pendingReview",
  APPROVED: "approved",
  REJECTED: "rejected",
};

interface TimelineItem {
  id: string;
  date: Date;
  type: "voice-note" | "reminder";
  data: VoiceNote | FollowUpReminder;
}

interface LeadTimelineProps {
  voiceNotes: VoiceNote[];
  reminders: FollowUpReminder[];
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export async function LeadTimeline({ voiceNotes, reminders }: LeadTimelineProps) {
  const t = await getTranslations("leads.timeline");
  const locale = await getLocale();
  const items: TimelineItem[] = [
    ...voiceNotes.map((vn) => ({
      id: vn.id,
      date: new Date(vn.createdAt),
      type: "voice-note" as const,
      data: vn,
    })),
    ...reminders.map((r) => ({
      id: r.id,
      date: new Date(r.dueDate),
      type: "reminder" as const,
      data: r,
    })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{t("noActivity")}</p>
    );
  }

  return (
    <div className="space-y-0">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        if (item.type === "voice-note") {
          const vn = item.data as VoiceNote;
          return (
            <div key={item.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400 shrink-0">
                  <Mic className="h-3.5 w-3.5" />
                </div>
                {!isLast && <div className="w-0.5 flex-1 bg-border mt-1" />}
              </div>
              <div className={cn("pb-4 min-w-0 flex-1", isLast && "pb-0")}>
                <p className="text-sm font-medium">{t("voiceNoteRecorded")}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{formatDateTime(item.date, locale)}</p>
                <div className="mt-1.5 rounded-md border bg-muted/40 p-2 text-xs space-y-1">
                  <p className="text-muted-foreground">{t("language")}: <span className="text-foreground">{vn.language}</span></p>
                  {vn.duration && (
                    <p className="text-muted-foreground">{t("duration")}: <span className="text-foreground">{formatDuration(vn.duration)}</span></p>
                  )}
                  <p className="text-muted-foreground">
                    {t("status")}:{" "}
                    <span className={cn(
                      "font-medium",
                      vn.validationStatus === "APPROVED" && "text-emerald-600",
                      vn.validationStatus === "REJECTED" && "text-destructive",
                    )}>
                      {t(VALIDATION_KEYS[vn.validationStatus] ?? "pendingReview")}
                    </span>
                  </p>
                  <a
                    href={vn.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {t("openFile")}
                  </a>
                </div>
              </div>
            </div>
          );
        }

        const reminder = item.data as FollowUpReminder;
        const isOverdue = !reminder.isCompleted && new Date(reminder.dueDate) < new Date();
        return (
          <div key={item.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full shrink-0",
                reminder.isCompleted
                  ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                  : isOverdue
                  ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                  : "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
              )}>
                {reminder.isCompleted ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : isOverdue ? (
                  <BellOff className="h-3.5 w-3.5" />
                ) : (
                  <Bell className="h-3.5 w-3.5" />
                )}
              </div>
              {!isLast && <div className="w-0.5 flex-1 bg-border mt-1" />}
            </div>
            <div className={cn("pb-4 min-w-0 flex-1", isLast && "pb-0")}>
              <p className="text-sm font-medium">
                {REMINDER_TYPE_KEYS[reminder.type] ? t(REMINDER_TYPE_KEYS[reminder.type]) : reminder.type}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("due")}: {formatDateTime(item.date, locale)}
                {reminder.isCompleted && reminder.completedAt && (
                  <> · {t("completed")} {formatDateTime(new Date(reminder.completedAt), locale)}</>
                )}
                {isOverdue && !reminder.isCompleted && (
                  <span className="text-destructive"> · {t("overdue")}</span>
                )}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}