"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Radio,
  Play,
  Square,
  Plus,
  Clock,
  CheckCircle2,
  Trash2,
  Users,
  SkipForward,
  BookmarkX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getCampaign,
  clearCampaign,
  saveCampaign,
  getTimeLeft,
  getHistory,
  clearHistory,
  getSavedPosts,
  clearSavedPosts,
  addToHistory,
  type Campaign,
  type CampaignHistoryEntry,
  type CampaignGroup,
  type SavedPosts,
} from "@/lib/campaign-store";

interface Props {
  availableGroups: CampaignGroup[];
}

const INTERVAL_OPTIONS = [
  { label: "5 min", value: 5 },
  { label: "10 min", value: 10 },
  { label: "15 min", value: 15 },
  { label: "30 min", value: 30 },
  { label: "Manual", value: 0 },
];

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export function CampaignsClient({ availableGroups }: Props) {
  const t = useTranslations("campaigns");
  const tPostGen = useTranslations("postGenerator");
  const tCommon = useTranslations("common");
  const router = useRouter();

  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [history, setHistory] = useState<CampaignHistoryEntry[]>([]);
  const [savedPosts, setSavedPosts] = useState<SavedPosts | null>(null);

  // New campaign form state
  const [showNewForm, setShowNewForm] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(
    new Set(availableGroups.map((g) => g.id))
  );
  const [intervalMinutes, setIntervalMinutes] = useState(10);

  // Load from localStorage on mount
  useEffect(() => {
    setActiveCampaign(getCampaign());
    setHistory(getHistory());
    setSavedPosts(getSavedPosts());
  }, []);

  // Sync active campaign timer every second
  useEffect(() => {
    const id = setInterval(() => {
      const c = getCampaign();
      if (!c || !c.isActive) {
        setActiveCampaign(null);
        return;
      }
      if (c.currentIndex >= c.groups.length) {
        addToHistory({
          id: c.startedAt.toString(),
          offerLabel: c.offerLabel,
          startedAt: c.startedAt,
          completedAt: Date.now(),
          totalGroups: c.groups.length,
          postedCount: c.postedCount ?? 0,
          skippedCount: c.skippedCount ?? 0,
        });
        clearCampaign();
        setActiveCampaign(null);
        setHistory(getHistory());
        return;
      }
      setActiveCampaign(c);
      setTimeLeft(Math.max(0, getTimeLeft(c)));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  function handleStop() {
    const c = getCampaign();
    if (c) {
      addToHistory({
        id: c.startedAt.toString(),
        offerLabel: c.offerLabel,
        startedAt: c.startedAt,
        completedAt: Date.now(),
        totalGroups: c.groups.length,
        postedCount: c.postedCount ?? 0,
        skippedCount: c.skippedCount ?? 0,
      });
    }
    clearCampaign();
    setActiveCampaign(null);
    setHistory(getHistory());
  }

  function handleStartCampaign() {
    if (!savedPosts) return;
    const groups = availableGroups.filter((g) => selectedGroups.has(g.id));
    if (groups.length === 0) return;

    const campaign: Campaign = {
      posts: savedPosts.posts,
      groups,
      currentIndex: 0,
      intervalMinutes,
      lastPostAt: null,
      isActive: true,
      offerLabel: savedPosts.offerLabel,
      startedAt: Date.now(),
      postedCount: 0,
      skippedCount: 0,
    };
    saveCampaign(campaign);
    setActiveCampaign(campaign);
    setTimeLeft(0);
    setShowNewForm(false);
  }

  function toggleGroup(id: string) {
    setSelectedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleClearHistory() {
    if (!confirm(t("confirmClearHistory"))) return;
    clearHistory();
    setHistory([]);
  }

  function handleDiscardSavedPosts() {
    clearSavedPosts();
    setSavedPosts(null);
  }

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Radio className="h-6 w-6 text-primary" />
          {t("title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Launch and manage timed Facebook posting campaigns.
        </p>
      </div>

      {/* ── Active Campaign ───────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{t("active")}</h2>

        {activeCampaign ? (
          <Card className="border-emerald-300 dark:border-emerald-800">
            <CardContent className="pt-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="font-semibold">{activeCampaign.offerLabel}</p>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {activeCampaign.currentIndex} / {activeCampaign.groups.length} groups done
                    {activeCampaign.intervalMinutes > 0
                      ? ` · interval: ${activeCampaign.intervalMinutes}m`
                      : " · manual mode"}
                  </p>
                </div>
                <Button variant="destructive" size="sm" onClick={handleStop}>
                  <Square className="h-4 w-4" />
                  {t("pause")}
                </Button>
              </div>

              {/* Progress bar */}
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                  style={{
                    width: `${(activeCampaign.currentIndex / activeCampaign.groups.length) * 100}%`,
                  }}
                />
              </div>

              {/* Timer */}
              {activeCampaign.intervalMinutes > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  {timeLeft === 0 ? (
                    <span className="font-semibold text-emerald-600 animate-pulse">Time to post now!</span>
                  ) : (
                    <span className="text-muted-foreground">
                      Next post in: <span className="font-mono font-semibold text-foreground">{formatTime(timeLeft)}</span>
                    </span>
                  )}
                </div>
              )}

              {/* Current group */}
              {activeCampaign.groups[activeCampaign.currentIndex] && (
                <div className="rounded-lg bg-muted/40 px-3 py-2 text-sm">
                  <span className="text-muted-foreground">Next group: </span>
                  <span className="font-medium">{activeCampaign.groups[activeCampaign.currentIndex].name}</span>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-10 text-center space-y-2">
            <Radio className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">{t("noCampaigns")}</p>
          </div>
        )}
      </section>

      {/* ── Start New Campaign ────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{t("title")}</h2>
          {!showNewForm && !activeCampaign && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowNewForm(true)}
              disabled={!savedPosts}
            >
              <Plus className="h-4 w-4" />
              Configure
            </Button>
          )}
        </div>

        {/* Saved posts banner */}
        {savedPosts ? (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
            <div>
              <p className="text-sm font-medium">{t("postsReady")}</p>
              <p className="text-xs text-muted-foreground">{savedPosts.offerLabel} · {t("postsSavedAt")} {formatDate(savedPosts.savedAt)}</p>
            </div>
            <button
              onClick={handleDiscardSavedPosts}
              className="text-muted-foreground hover:text-destructive transition-colors"
              title={t("tooltipDiscardPosts")}
            >
              <BookmarkX className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed px-4 py-4 text-sm text-muted-foreground space-y-2">
            <p>No posts saved yet.</p>
            <button
              onClick={() => router.push("/post-generator")}
              className="text-primary underline underline-offset-2 hover:no-underline text-sm"
            >
              {tPostGen("goToCampaigns")} → {tPostGen("generatePosts")} → {tPostGen("saveForCampaign")}
            </button>
          </div>
        )}

        {/* Configuration form */}
        {showNewForm && savedPosts && !activeCampaign && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Play className="h-4 w-4 text-primary" />
                Campaign Setup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Interval */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Posting interval
                </label>
                <div className="flex flex-wrap gap-2">
                  {INTERVAL_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setIntervalMinutes(opt.value)}
                      className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                        intervalMinutes === opt.value
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:bg-muted"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {intervalMinutes === 0
                    ? "You manually control each post via the floating widget."
                    : `The widget will alert you every ${intervalMinutes} minutes to post to the next group.`}
                </p>
              </div>

              {/* Group selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Target groups ({selectedGroups.size} selected)
                  </label>
                  <div className="flex gap-3">
                    <button
                      className="text-xs text-primary hover:underline"
                      onClick={() => setSelectedGroups(new Set(availableGroups.map((g) => g.id)))}
                    >
                      {tCommon("all")}
                    </button>
                    <button
                      className="text-xs text-muted-foreground hover:underline"
                      onClick={() => setSelectedGroups(new Set())}
                    >
                      {tCommon("none")}
                    </button>
                  </div>
                </div>

                {availableGroups.length === 0 ? (
                  <p className="text-sm text-amber-600">
                    No groups with URLs found. Go to Settings → Facebook Groups and add URLs.
                  </p>
                ) : (
                  <div className="space-y-1 max-h-52 overflow-y-auto border rounded-lg p-2">
                    {availableGroups.map((g) => (
                      <label key={g.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-muted/40 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedGroups.has(g.id)}
                          onChange={() => toggleGroup(g.id)}
                          className="rounded"
                        />
                        <span className="text-sm truncate">{g.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  className="flex-1"
                  onClick={handleStartCampaign}
                  disabled={selectedGroups.size === 0}
                >
                  <Play className="h-4 w-4" />
                  {t("title")} ({selectedGroups.size} groups)
                </Button>
                <Button variant="outline" onClick={() => setShowNewForm(false)}>
                  {tCommon("cancel")}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick start button when form is hidden and posts are ready */}
        {!showNewForm && savedPosts && !activeCampaign && (
          <Button
            className="w-full"
            onClick={() => setShowNewForm(true)}
          >
            <Play className="h-4 w-4" />
            {t("title")}
          </Button>
        )}
      </section>

      {/* ── Campaign History ──────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{t("completed")}</h2>
          {history.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {tCommon("clear")}
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-10 text-center space-y-2">
            <Clock className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">{t("noCampaigns")}</p>
          </div>
        ) : (
          <div className="rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">{tCommon("name")}</th>
                  <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">{tCommon("date")}</th>
                  <th className="text-left px-4 py-3 font-medium">Groups</th>
                  <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">{tCommon("status")}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {history.map((entry) => (
                  <tr key={entry.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-medium truncate max-w-[180px] block">{entry.offerLabel}</span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground text-xs">
                      {formatDate(entry.startedAt)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {entry.totalGroups}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <div className="flex items-center gap-3 text-xs">
                        <span className="flex items-center gap-1 text-emerald-600">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {entry.postedCount} posted
                        </span>
                        {entry.skippedCount > 0 && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <SkipForward className="h-3.5 w-3.5" />
                            {entry.skippedCount} skipped
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
