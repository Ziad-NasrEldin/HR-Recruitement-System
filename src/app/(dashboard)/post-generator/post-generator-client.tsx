"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Sparkles, Copy, CheckCheck, Loader2, RefreshCw,
  AlertCircle, Send, History, ChevronDown, ChevronUp, Clock, Bookmark,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { savePosts } from "@/lib/campaign-store";
import Link from "next/link";

interface Offer {
  id: string;
  company: string;
  accountType: string;
  language: string;
  location: string;
}

interface Props {
  offers: Offer[];
}

interface PostSession {
  id: string;
  offerLabel: string;
  posts: string[];
  createdAt: string;
}

const STORAGE_KEY = "post_generator_history";
const MAX_HISTORY = 20;

function loadHistory(): PostSession[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as PostSession[];
  } catch {
    return [];
  }
}

function saveToHistory(session: PostSession) {
  const history = loadHistory();
  const updated = [session, ...history].slice(0, MAX_HISTORY);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function PostGeneratorClient({ offers }: Props) {
  const t = useTranslations("postGenerator");
  const tErrors = useTranslations("errors");
  const router = useRouter();
  const [selectedOfferId, setSelectedOfferId] = useState("");
  const [posts, setPosts] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const [history, setHistory] = useState<PostSession[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
  const [postsSaved, setPostsSaved] = useState(false);

  const postLabels = [
    t("labels.mysterious"),
    t("labels.benefit"),
    t("labels.urgency"),
    t("labels.community"),
    t("labels.direct"),
  ];

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const selectedOffer = offers.find((o) => o.id === selectedOfferId);

  async function generatePosts() {
    if (!selectedOfferId) return;
    setLoading(true);
    setError(null);
    setPosts([]);
    setActiveHistoryId(null);

    try {
      const res = await fetch("/api/ai/generate-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerId: selectedOfferId }),
      });

      const data = await res.json() as { posts?: string[]; error?: string };

      if (!res.ok) {
        setError(data.error ?? tErrors("generationFailed"));
      } else {
        const newPosts = data.posts ?? [];
        setPosts(newPosts);

        // Save to history
        const session: PostSession = {
          id: Date.now().toString(),
          offerLabel: `${selectedOffer?.company} — ${selectedOffer?.accountType} (${selectedOffer?.language})`,
          posts: newPosts,
          createdAt: new Date().toISOString(),
        };
        saveToHistory(session);
        setHistory(loadHistory());
        setActiveHistoryId(session.id);
      }
    } catch {
      setError(tErrors("networkError"));
    } finally {
      setLoading(false);
    }
  }

  function loadHistorySession(session: PostSession) {
    setPosts(session.posts);
    setActiveHistoryId(session.id);
    setError(null);
    setHistoryOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function copyPost(text: string, index: number) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  }

  async function copyAll() {
    const allText = posts
      .map((p, i) => `— ${postLabels[i]} —\n\n${p}`)
      .join("\n\n" + "─".repeat(40) + "\n\n");
    await copyPost(allText, -1);
  }

  function startGroupPosting(postText: string) {
    router.push(`/post-generator/session?post=${encodeURIComponent(postText)}`);
  }

  function handleSaveForCampaign() {
    if (!posts.length || !selectedOffer) return;
    const offerLabel = `${selectedOffer.company} — ${selectedOffer.accountType} (${selectedOffer.language})`;
    savePosts({ posts, offerLabel, savedAt: Date.now() });
    setPostsSaved(true);
    setTimeout(() => setPostsSaved(false), 5000);
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString("en-GB", {
      day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("description")}
          </p>
        </div>
        {history.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setHistoryOpen(!historyOpen)}
            className="shrink-0"
          >
            <History className="h-4 w-4" />
            {t("history.button", { count: history.length })}
            {historyOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>
        )}
      </div>

      {/* History panel */}
      {historyOpen && history.length > 0 && (
        <Card className="border-dashed">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {t("history.title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {history.map((s) => (
              <button
                key={s.id}
                onClick={() => loadHistorySession(s)}
                className={`w-full text-left flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  activeHistoryId === s.id
                    ? "bg-primary/10 text-primary font-medium"
                    : "hover:bg-muted"
                }`}
              >
                <span className="truncate">{s.offerLabel}</span>
                <span className="text-xs text-muted-foreground shrink-0">{formatDate(s.createdAt)}</span>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Controls */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("selectOffer")}</label>
            <Select
              value={selectedOfferId}
              onChange={(e) => {
                setSelectedOfferId(e.target.value);
                setPosts([]);
                setError(null);
                setActiveHistoryId(null);
              }}
              className="w-full"
            >
              <option value="">{t("chooseOffer")}</option>
              {offers.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.company} — {o.accountType} ({o.language} · {o.location})
                </option>
              ))}
            </Select>
          </div>

          {selectedOffer && (
            <div className="rounded-lg bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
              {t("generatingFor")}{" "}
              <span className="font-medium text-foreground">
                {selectedOffer.accountType}
              </span>{" "}
              · {selectedOffer.language} · {selectedOffer.location}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              className="flex-1"
              onClick={generatePosts}
              disabled={!selectedOfferId || loading}
              variant="outline"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> {t("generating")}</>
              ) : posts.length > 0 ? (
                <><RefreshCw className="h-4 w-4" /> {t("regeneratePosts")}</>
              ) : (
                <><Sparkles className="h-4 w-4" /> {t("generatePosts")}</>
              )}
            </Button>
            <Button
              className="flex-1"
              onClick={handleSaveForCampaign}
              disabled={posts.length === 0 || loading}
            >
              <Bookmark className="h-4 w-4" />
              {t("saveForCampaign")}
            </Button>
          </div>

          {postsSaved && (
            <div className="rounded-lg px-4 py-3 text-sm bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 flex items-center justify-between gap-3">
              <span>{t("postsSaved")}</span>
              <Link href="/campaigns" className="font-medium underline underline-offset-2 hover:no-underline shrink-0">
                {t("goToCampaigns")} →
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-card animate-pulse">
              <div className="px-5 py-4 space-y-3">
                <div className="h-3 w-40 rounded bg-muted" />
                <div className="h-4 w-full rounded bg-muted" />
                <div className="h-4 w-4/5 rounded bg-muted" />
                <div className="h-4 w-3/5 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Generated posts */}
      {!loading && posts.length > 0 && (
        <>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-sm font-medium text-muted-foreground">
              {t("postsGenerated", { count: posts.length })}
            </p>
            <Button variant="outline" size="sm" onClick={copyAll}>
              {copiedIndex === -1 ? (
                <><CheckCheck className="h-4 w-4 text-emerald-600" /> {t("copiedAll")}</>
              ) : (
                <><Copy className="h-4 w-4" /> {t("copyAll")}</>
              )}
            </Button>
          </div>

          <div className="space-y-4">
            {posts.map((post, i) => (
              <div key={i} className="group rounded-xl border bg-card overflow-hidden">
                {/* Post label bar */}
                <div className="flex items-center justify-between px-5 py-3 bg-muted/30 border-b">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                      {i + 1}
                    </span>
                    <span className="text-sm font-medium">
                      {postLabels[i] ?? `Post ${i + 1}`}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyPost(post, i)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {copiedIndex === i ? (
                      <><CheckCheck className="h-4 w-4 text-emerald-600" /> {t("copied")}</>
                    ) : (
                      <><Copy className="h-4 w-4" /> {t("copy")}</>
                    )}
                  </Button>
                </div>

                {/* Post body */}
                <div className="px-5 py-4">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{post}</p>
                </div>

                {/* Action buttons */}
                <div className="px-5 pb-4 flex items-center gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyPost(post, i)}
                  >
                    {copiedIndex === i ? (
                      <><CheckCheck className="h-4 w-4 text-emerald-600" /> {t("copied")}</>
                    ) : (
                      <><Copy className="h-4 w-4" /> {t("copy")}</>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => startGroupPosting(post)}
                  >
                    <Send className="h-4 w-4" />
                    {t("postToGroups")}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Empty state */}
      {!loading && posts.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center space-y-2">
          <Sparkles className="h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            {t("empty")}
          </p>
        </div>
      )}
    </div>
  );
}
