"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronRight,
  Copy,
  CheckCheck,
  ExternalLink,
  Play,
  SkipForward,
  RotateCcw,
  CheckCircle2,
  Clock,
  Users,
  Pause,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Group {
  id: string;
  name: string;
  url: string;
}

interface Props {
  groups: Group[];
}

type SessionState = "setup" | "running" | "paused" | "done";

const INTERVAL_OPTIONS = [
  { label: "30 seconds", value: 30 },
  { label: "1 minute", value: 60 },
  { label: "2 minutes", value: 120 },
  { label: "3 minutes", value: 180 },
  { label: "5 minutes", value: 300 },
  { label: "Manual only", value: 0 },
];

export function PostingSessionClient({ groups }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const postText = searchParams.get("post") ? decodeURIComponent(searchParams.get("post")!) : "";

  const [sessionState, setSessionState] = useState<SessionState>("setup");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set());
  const [skippedIds, setSkippedIds] = useState<Set<string>>(new Set());
  const [intervalSecs, setIntervalSecs] = useState(60);
  const [countdown, setCountdown] = useState(0);
  const [copied, setCopied] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(
    new Set(groups.map((g) => g.id))
  );

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const activeGroups = groups.filter((g) => selectedGroups.has(g.id));
  const currentGroup = activeGroups[currentIndex] ?? null;
  const isLast = currentIndex >= activeGroups.length - 1;

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startCountdown = useCallback(() => {
    if (intervalSecs === 0) return;
    setCountdown(intervalSecs);
    clearTimer();
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearTimer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [intervalSecs, clearTimer]);

  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  // Open group tab and copy text automatically when current group changes during running session
  const openCurrentGroup = useCallback(
    (group: Group) => {
      window.open(group.url, "_blank", "noopener,noreferrer");
      navigator.clipboard.writeText(postText).catch(() => {});
    },
    [postText]
  );

  function startSession() {
    if (activeGroups.length === 0) return;
    setSessionState("running");
    setCurrentIndex(0);
    setDoneIds(new Set());
    setSkippedIds(new Set());
    openCurrentGroup(activeGroups[0]);
    startCountdown();
  }

  function markDoneAndNext() {
    if (!currentGroup) return;
    setDoneIds((prev) => new Set(prev).add(currentGroup.id));
    clearTimer();
    if (isLast) {
      setSessionState("done");
    } else {
      const next = currentIndex + 1;
      setCurrentIndex(next);
      openCurrentGroup(activeGroups[next]);
      startCountdown();
    }
  }

  function skipGroup() {
    if (!currentGroup) return;
    setSkippedIds((prev) => new Set(prev).add(currentGroup.id));
    clearTimer();
    if (isLast) {
      setSessionState("done");
    } else {
      const next = currentIndex + 1;
      setCurrentIndex(next);
      openCurrentGroup(activeGroups[next]);
      startCountdown();
    }
  }

  function pauseSession() {
    clearTimer();
    setSessionState("paused");
  }

  function resumeSession() {
    setSessionState("running");
    if (currentGroup) {
      openCurrentGroup(currentGroup);
      startCountdown();
    }
  }

  async function copyPost() {
    try {
      await navigator.clipboard.writeText(postText);
    } catch {
      const el = document.createElement("textarea");
      el.value = postText;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function toggleGroup(id: string) {
    setSelectedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // ─── SETUP SCREEN ────────────────────────────────────────
  if (sessionState === "setup") {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-xl font-bold">Posting Session Setup</h1>
            <p className="text-sm text-muted-foreground">{activeGroups.length} groups selected · {groups.length} available</p>
          </div>
        </div>

        {/* Post preview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Post Text</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {postText ? (
              <>
                <p className="text-sm leading-relaxed whitespace-pre-wrap bg-muted/40 rounded-lg p-3">
                  {postText}
                </p>
                <Button variant="outline" size="sm" onClick={copyPost}>
                  {copied ? <><CheckCheck className="h-4 w-4 text-emerald-600" /> Copied!</> : <><Copy className="h-4 w-4" /> Copy post</>}
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                No post text provided. Go back to the post generator and select a post first.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Interval */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Auto-advance Interval
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {INTERVAL_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setIntervalSecs(opt.value)}
                  className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                    intervalSecs === opt.value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {intervalSecs === 0
                ? "You manually control when to move to the next group."
                : `After opening each group, a ${intervalSecs}s countdown starts. You still control when to mark as done.`}
            </p>
          </CardContent>
        </Card>

        {/* Group selection */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Target Groups ({activeGroups.length} selected)
              </CardTitle>
              <div className="flex gap-2">
                <button
                  className="text-xs text-primary hover:underline"
                  onClick={() => setSelectedGroups(new Set(groups.map((g) => g.id)))}
                >
                  All
                </button>
                <button
                  className="text-xs text-muted-foreground hover:underline"
                  onClick={() => setSelectedGroups(new Set())}
                >
                  None
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {groups.length === 0 ? (
              <p className="text-sm text-amber-600">
                No groups with URLs found. Go to Settings → Facebook Groups and add URLs first.
              </p>
            ) : (
              <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
                {groups.map((g) => (
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
          </CardContent>
        </Card>

        <Button
          className="w-full"
          size="lg"
          onClick={startSession}
          disabled={!postText || activeGroups.length === 0}
        >
          <Play className="h-4 w-4" />
          Start Posting Session
        </Button>
      </div>
    );
  }

  // ─── DONE SCREEN ─────────────────────────────────────────
  if (sessionState === "done") {
    return (
      <div className="mx-auto max-w-md space-y-6 text-center py-12">
        <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto" />
        <div>
          <h1 className="text-2xl font-bold">Session Complete!</h1>
          <p className="text-muted-foreground mt-1">
            {doneIds.size} posted · {skippedIds.size} skipped
          </p>
        </div>
        <div className="flex justify-center gap-3">
          <Button variant="outline" onClick={() => router.push("/post-generator")}>
            Back to Generator
          </Button>
          <Button onClick={() => {
            setSessionState("setup");
            setCurrentIndex(0);
            setDoneIds(new Set());
            setSkippedIds(new Set());
          }}>
            <RotateCcw className="h-4 w-4" />
            New Session
          </Button>
        </div>
      </div>
    );
  }

  // ─── RUNNING / PAUSED SCREEN ─────────────────────────────
  const progress = ((doneIds.size + skippedIds.size) / activeGroups.length) * 100;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between text-sm mb-1.5">
          <span className="font-medium">
            Group {currentIndex + 1} of {activeGroups.length}
          </span>
          <span className="text-muted-foreground">
            {doneIds.size} done · {skippedIds.size} skipped
          </span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Current group */}
      {currentGroup && (
        <Card className="border-primary/30">
          <CardContent className="pt-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Current Group</p>
                <h2 className="text-lg font-semibold">{currentGroup.name}</h2>
                <a
                  href={currentGroup.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary underline underline-offset-2 hover:no-underline"
                >
                  {currentGroup.url}
                </a>
              </div>
              <a
                href={currentGroup.url}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0"
              >
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4" />
                  Open Group
                </Button>
              </a>
            </div>

            {/* Countdown */}
            {intervalSecs > 0 && sessionState === "running" && countdown > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Auto-advancing in {countdown}s</span>
              </div>
            )}

            {/* Post text */}
            <div className="rounded-lg bg-muted/40 p-3 space-y-2">
              <p className="text-xs text-muted-foreground font-medium">Post text (already copied to clipboard)</p>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{postText}</p>
              <Button variant="outline" size="sm" onClick={copyPost}>
                {copied ? <><CheckCheck className="h-4 w-4 text-emerald-600" /> Copied!</> : <><Copy className="h-4 w-4" /> Copy again</>}
              </Button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button onClick={markDoneAndNext} className="flex-1">
                <CheckCheck className="h-4 w-4" />
                {isLast ? "Mark done & finish" : "Mark done & next"}
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={skipGroup}>
                <SkipForward className="h-4 w-4" />
                Skip
              </Button>
              {sessionState === "running" ? (
                <Button variant="outline" onClick={pauseSession}>
                  <Pause className="h-4 w-4" />
                  Pause
                </Button>
              ) : (
                <Button variant="outline" onClick={resumeSession}>
                  <Play className="h-4 w-4" />
                  Resume
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Queue preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {activeGroups.map((g, i) => (
              <div
                key={g.id}
                className={`flex items-center gap-2 px-2 py-1 rounded text-sm ${
                  i === currentIndex ? "bg-primary/10 font-medium" : ""
                }`}
              >
                {doneIds.has(g.id) ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                ) : skippedIds.has(g.id) ? (
                  <SkipForward className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                ) : i === currentIndex ? (
                  <ChevronRight className="h-3.5 w-3.5 text-primary shrink-0" />
                ) : (
                  <span className="h-3.5 w-3.5 shrink-0" />
                )}
                <span className="truncate">{g.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
