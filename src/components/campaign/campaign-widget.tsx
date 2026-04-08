"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { Send, SkipForward, X, Play, CheckCircle2, Bell } from "lucide-react";
import {
  getCampaign,
  clearCampaign,
  getTimeLeft,
  advanceCampaign,
  skipCampaign,
  addToHistory,
  type Campaign,
} from "@/lib/campaign-store";

const NOTIF_PREF_KEY = "notifications_dismissed";

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function CampaignWidget() {
  const t = useTranslations("campaigns");
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [done, setDone] = useState(false);
  const [copied, setCopied] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | null>(null);
  const [showNotifBanner, setShowNotifBanner] = useState(false);
  const audioRef = useRef<AudioContext | null>(null);

  // Check notification permission on mount
  useEffect(() => {
    if (typeof Notification !== "undefined") {
      setNotifPermission(Notification.permission);
    }
  }, []);

  // Show notification banner when campaign starts and permission not yet granted
  useEffect(() => {
    const dismissed = localStorage.getItem(NOTIF_PREF_KEY) === "true";
    if (campaign && notifPermission === "default" && !dismissed) {
      setShowNotifBanner(true);
    } else {
      setShowNotifBanner(false);
    }
  }, [campaign, notifPermission]);

  async function requestNotifications() {
    if (typeof Notification === "undefined") return;
    const result = await Notification.requestPermission();
    setNotifPermission(result);
    setShowNotifBanner(false);
  }

  function dismissNotifBanner() {
    localStorage.setItem(NOTIF_PREF_KEY, "true");
    setShowNotifBanner(false);
  }

  // Sync from localStorage every second
  useEffect(() => {
    function tick() {
      const c = getCampaign();
      if (!c || !c.isActive) {
        setCampaign(null);
        return;
      }
      if (c.currentIndex >= c.groups.length) {
        // Save to history before clearing
        addToHistory({
          id: c.startedAt.toString(),
          offerLabel: c.offerLabel,
          startedAt: c.startedAt,
          completedAt: Date.now(),
          totalGroups: c.groups.length,
          postedCount: c.postedCount ?? 0,
          skippedCount: c.skippedCount ?? 0,
        });
        setCampaign(null);
        clearCampaign();
        setDone(true);
        setTimeout(() => setDone(false), 6000);
        return;
      }
      setCampaign(c);
      setTimeLeft(Math.max(0, getTimeLeft(c)));
    }

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Play a soft beep when it's time to post
  const playBeep = useCallback(() => {
    try {
      if (!audioRef.current) audioRef.current = new AudioContext();
      const ctx = audioRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } catch {
      // Audio blocked by browser — no-op
    }
  }, []);

  // Fire desktop notification when it's time to post
  const fireNotification = useCallback((groupName: string) => {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    try {
      new Notification("Time to post! 📢", {
        body: `Group: ${groupName}`,
        icon: "/favicon.ico",
      });
    } catch {
      // Notifications blocked — no-op
    }
  }, []);

  const prevTimeLeft = useRef<number>(9999);
  useEffect(() => {
    if (prevTimeLeft.current > 0 && timeLeft === 0 && campaign) {
      playBeep();
      const group = campaign.groups[campaign.currentIndex];
      if (group) fireNotification(group.name);
    }
    prevTimeLeft.current = timeLeft;
  }, [timeLeft, campaign, playBeep, fireNotification]);

  function handlePost() {
    if (!campaign) return;
    const group = campaign.groups[campaign.currentIndex];
    const post = campaign.posts[campaign.currentIndex % campaign.posts.length];

    window.open(group.url, "_blank", "noopener,noreferrer");
    navigator.clipboard.writeText(post).catch(() => {
      const el = document.createElement("textarea");
      el.value = post;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    });

    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    const updated = advanceCampaign(campaign);
    setCampaign(updated);
    setTimeLeft(updated.intervalMinutes * 60);
  }

  function handleSkip() {
    if (!campaign) return;
    const updated = skipCampaign(campaign);
    setCampaign(updated);
    setTimeLeft(updated.intervalMinutes * 60);
  }

  function handleStop() {
    if (campaign) {
      addToHistory({
        id: campaign.startedAt.toString(),
        offerLabel: campaign.offerLabel,
        startedAt: campaign.startedAt,
        completedAt: Date.now(),
        totalGroups: campaign.groups.length,
        postedCount: campaign.postedCount ?? 0,
        skippedCount: campaign.skippedCount ?? 0,
      });
    }
    clearCampaign();
    setCampaign(null);
  }

  // ── Done flash ────────────────────────────────────────────
  if (done) {
    return (
      <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 dark:bg-emerald-950 px-4 py-3 shadow-lg text-sm font-medium text-emerald-700 dark:text-emerald-300">
        <CheckCircle2 className="h-4 w-4" />
        Campaign complete! All groups posted.
      </div>
    );
  }

  if (!campaign) return null;

  const group = campaign.groups[campaign.currentIndex];
  const postIndex = campaign.currentIndex % campaign.posts.length;
  const done_count = campaign.currentIndex;
  const total = campaign.groups.length;
  const isTimeToPost = timeLeft === 0;

  // ── Time to post ─────────────────────────────────────────
  if (isTimeToPost) {
    return (
      <div
        className={`fixed bottom-5 right-5 z-50 w-72 rounded-2xl border-2 shadow-xl bg-card transition-all ${
          copied
            ? "border-emerald-400"
            : "border-emerald-500 animate-pulse"
        }`}
        style={{ animationDuration: "1.4s" }}
      >
        {/* Notification banner */}
        {showNotifBanner && (
          <div className="flex items-center justify-between gap-2 px-3 py-2 bg-muted/60 rounded-t-2xl border-b text-xs">
            <div className="flex items-center gap-1.5">
              <Bell className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Enable desktop notifications?</span>
            </div>
            <div className="flex gap-1">
              <button
                onClick={requestNotifications}
                className="px-2 py-0.5 rounded bg-primary text-primary-foreground font-medium"
              >
                Allow
              </button>
              <button onClick={dismissNotifBanner} className="px-1.5 py-0.5 rounded hover:bg-muted text-muted-foreground">
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Top bar */}
        <div className="flex items-center justify-between px-4 pt-3 pb-1">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">
              Time to Post
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            {done_count}/{total}
          </span>
        </div>

        {/* Group name */}
        <div className="px-4 py-2">
          <p className="font-semibold text-sm leading-snug truncate">{group.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Post {postIndex + 1} of {campaign.posts.length}
          </p>
        </div>

        {/* Actions */}
        <div className="px-4 pb-4 flex items-center gap-2">
          <button
            onClick={handlePost}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 text-sm transition-colors"
          >
            {copied ? (
              <><CheckCircle2 className="h-4 w-4" /> {t("widget.copiedPaste")}</>
            ) : (
              <><Send className="h-4 w-4" /> {t("widget.postNow")}</>
            )}
          </button>
          <button
            onClick={handleSkip}
            className="p-2.5 rounded-xl border hover:bg-muted transition-colors"
            title={t("widget.skipGroup")}
          >
            <SkipForward className="h-4 w-4 text-muted-foreground" />
          </button>
          <button
            onClick={handleStop}
            className="p-2.5 rounded-xl border hover:bg-destructive/10 transition-colors"
            title={t("widget.stopCampaign")}
          >
            <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
          </button>
        </div>
      </div>
    );
  }

  // ── Counting down ─────────────────────────────────────────
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-1.5">
      {showNotifBanner && (
        <div className="flex items-center gap-2 rounded-xl border bg-card px-3 py-2 shadow-md text-xs">
          <Bell className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">{t("enableNotifications")}</span>
          <button
            onClick={requestNotifications}
            className="px-2 py-0.5 rounded bg-primary text-primary-foreground font-medium"
          >
            {t("widget.allow")}
          </button>
          <button onClick={dismissNotifBanner} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>
      )}
      <div className="flex items-center gap-2.5 rounded-full border bg-card px-4 py-2 shadow-md text-sm">
        <Play className="h-3.5 w-3.5 text-primary" />
        <span className="font-medium text-foreground">{t("widget.campaign")}</span>
        <span className="text-muted-foreground">·</span>
        <span className="font-mono font-medium tabular-nums">{formatTime(timeLeft)}</span>
        <span className="text-muted-foreground text-xs">
          ({done_count}/{total})
        </span>
        <button
          onClick={handleStop}
          className="ml-1 rounded-full p-0.5 hover:bg-muted transition-colors"
          title={t("widget.stopCampaign")}
        >
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}
