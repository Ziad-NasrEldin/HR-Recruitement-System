"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Bell, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Reminder {
  id: string;
  type: string;
  dueDate: string;
  isCompleted: boolean;
  lead: { id: string; name: string; phone: string };
  recruiter: { id: string; name: string };
}

const REMINDER_TYPE_LABELS: Record<string, Record<string, string>> = {
  PRE_INTERVIEW: { en: "Pre-Interview", ar: "قبل المقابلة", fr: "Avant l'entretien", de: "Vor dem Interview" },
  POST_INTERVIEW: { en: "Post-Interview", ar: "بعد المقابلة", fr: "Après l'entretien", de: "Nach dem Interview" },
  DAY_10: { en: "Day 10 Check-in", ar: "متابعة اليوم العاشر", fr: "Jour 10", de: "Tag 10" },
  DAY_15: { en: "Day 15 Check-in", ar: "متابعة اليوم الخامس عشر", fr: "Jour 15", de: "Tag 15" },
  DAY_30: { en: "Day 30 Check-in", ar: "متابعة اليوم الثلاثين", fr: "Jour 30", de: "Tag 30" },
};

function formatDueDate(dateStr: string, locale: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const overdueDays = Math.abs(diffDays);
    if (locale === "ar") return overdueDays === 1 ? "متأخر يوم واحد" : `متأخر ${overdueDays} أيام`;
    if (locale === "fr") return overdueDays === 1 ? "1 jour de retard" : `${overdueDays} jours de retard`;
    if (locale === "de") return overdueDays === 1 ? "1 Tag überfällig" : `${overdueDays} Tage überfällig`;
    return overdueDays === 1 ? "1 day overdue" : `${overdueDays} days overdue`;
  }
  if (diffDays === 0) {
    if (locale === "ar") return "مستحق اليوم";
    if (locale === "fr") return "Dû aujourd'hui";
    if (locale === "de") return "Heute fällig";
    return "Due today";
  }
  if (diffDays === 1) {
    if (locale === "ar") return "مستحق غداً";
    if (locale === "fr") return "Dû demain";
    if (locale === "de") return "Morgen fällig";
    return "Due tomorrow";
  }
  if (locale === "ar") return `مستحق خلال ${diffDays} أيام`;
  if (locale === "fr") return `Dû dans ${diffDays} jours`;
  if (locale === "de") return `Fällig in ${diffDays} Tagen`;
  return `Due in ${diffDays} days`;
}

function getReminderTypeLabel(type: string, locale: string): string {
  const labels = REMINDER_TYPE_LABELS[type];
  if (!labels) return type;
  return labels[locale] ?? labels.en ?? type;
}

export function ReminderBell() {
  const t = useTranslations("reminders");
  const tNav = useTranslations("nav");
  const locale = useLocale();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [overdue, setOverdue] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const fetchReminders = useCallback(async () => {
    try {
      const res = await fetch("/api/reminders");
      if (!res.ok) return;
      const data = await res.json();
      setReminders(data.reminders ?? []);
      setOverdue(data.overdue ?? []);
    } catch {
      // silently fail — non-critical UI
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReminders();
    // Refresh every 5 minutes
    const interval = setInterval(fetchReminders, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchReminders]);

  async function markComplete(reminderId: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await fetch(`/api/reminders/${reminderId}/complete`, {
        method: "PATCH",
      });
      if (res.ok) {
        setReminders((prev) => prev.filter((r) => r.id !== reminderId));
        setOverdue((prev) => prev.filter((r) => r.id !== reminderId));
      }
    } catch {
      // silently fail
    }
  }

  const totalCount = reminders.length;
  const overdueCount = overdue.length;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        className="relative flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={t("aria.reminders")}
      >
        <Bell className="h-5 w-5 text-muted-foreground" />
        {totalCount > 0 && (
          <span
            className={cn(
              "absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white",
              overdueCount > 0 ? "bg-destructive" : "bg-primary"
            )}
          >
            {totalCount > 9 ? "9+" : totalCount}
          </span>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>{t("title")}</span>
          {overdueCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {overdueCount} {t("overdue")}
            </Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {loading ? (
          <div className="px-3 py-4 text-center text-sm text-muted-foreground">
            {t("loading")}
          </div>
        ) : reminders.length === 0 ? (
          <div className="px-3 py-4 text-center text-sm text-muted-foreground">
            {t("empty")}
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {reminders.map((reminder) => {
              const isOverdue = new Date(reminder.dueDate) < new Date();
              return (
                <div key={reminder.id} className="group relative">
                  <Link
                    href={`/leads/${reminder.lead.id}`}
                    onClick={() => setOpen(false)}
                    className="flex items-start gap-3 px-3 py-2.5 hover:bg-muted/50 transition-colors"
                  >
                    <div className="mt-0.5 shrink-0">
                      {isOverdue ? (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      ) : (
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-tight truncate">
                        {reminder.lead.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {REMINDER_TYPE_LABELS[reminder.type]?.[locale] ?? reminder.type}
                      </p>
                      <p
                        className={cn(
                          "text-xs mt-0.5",
                          isOverdue ? "text-destructive font-medium" : "text-muted-foreground"
                        )}
                      >
                        {formatDueDate(reminder.dueDate, locale)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => markComplete(reminder.id, e)}
                      className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                      title={t("markDone")}
                      aria-label={t("markDone")}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </button>
                  </Link>
                </div>
              );
            })}
          </div>
        )}

        {reminders.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="px-3 py-2 text-center">
              <Link
                href="/leads"
                onClick={() => setOpen(false)}
                className="text-xs text-primary hover:underline"
                aria-label={tNav("leads")}
              >
                {t("viewAllLeads")}
              </Link>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
