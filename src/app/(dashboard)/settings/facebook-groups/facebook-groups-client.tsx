"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Users,
  Plus,
  Trash2,
  ExternalLink,
  Link2,
  Link2Off,
  DownloadCloud,
  Search,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Ban,
  RotateCcw,
  Eye,
  EyeOff,
  Wand2,
  Loader2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface FacebookGroup {
  id: string;
  name: string;
  url: string | null;
  isActive: boolean;
  isDeprecated: boolean;
  deprecationReason: string | null;
  source: string | null;
  createdAt: Date | string;
}

interface ParsedPreview {
  rows: { name: string; url?: string }[];
  withUrl: number;
}

interface FoundUrlResult {
  id: string;
  name: string;
  foundUrl: string | null;
  error?: string;
  accepted?: boolean;
}

interface Props {
  initialGroups: FacebookGroup[];
}

/** Parse a CSV string into name/url rows. Handles quoted fields. */
function parseCsv(text: string): { name: string; url?: string }[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const rows: { name: string; url?: string }[] = [];

  for (const line of lines) {
    // Simple CSV split: split by comma, strip quotes
    const cols = line.split(",").map((c) => c.replace(/^["']|["']$/g, "").trim());
    const name = cols[0];
    const url = cols[1] ?? "";

    // Skip header rows
    if (!name || name.toLowerCase() === "name" || name.toLowerCase() === "group name") continue;
    // Skip rows that look like headers for URL column too
    if (url.toLowerCase() === "url" || url.toLowerCase() === "link") continue;

    rows.push({ name, url: url || undefined });
  }
  return rows;
}

export function FacebookGroupsClient({ initialGroups }: Props) {
  const t = useTranslations("facebookGroups");
  const tErrors = useTranslations("errors");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [groups, setGroups] = useState(initialGroups);
  const [search, setSearch] = useState("");
  const [showDeprecated, setShowDeprecated] = useState(false);
  const [importPending, startImport] = useTransition();
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [importMsgType, setImportMsgType] = useState<"success" | "error">("success");

  // CSV import state
  const [csvPreview, setCsvPreview] = useState<ParsedPreview | null>(null);
  const [csvImporting, setCsvImporting] = useState(false);

  // Add group form
  const [addName, setAddName] = useState("");
  const [addUrl, setAddUrl] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  // Inline URL edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editUrl, setEditUrl] = useState("");

  // Inline deprecate
  const [deprecatingId, setDeprecatingId] = useState<string | null>(null);
  const [deprecateReason, setDeprecateReason] = useState("");

  // Find missing URLs panel
  const [findUrlsOpen, setFindUrlsOpen] = useState(false);
  const [findUrlsRunning, setFindUrlsRunning] = useState(false);
  const [findUrlsProgress, setFindUrlsProgress] = useState(0);
  const [findUrlsTotal, setFindUrlsTotal] = useState(0);
  const [findUrlsResults, setFindUrlsResults] = useState<FoundUrlResult[]>([]);
  const [findUrlsApplying, setFindUrlsApplying] = useState(false);

  const activeGroups = groups.filter((g) => !g.isDeprecated);
  const deprecatedGroups = groups.filter((g) => g.isDeprecated);
  const displayGroups = showDeprecated ? groups : activeGroups;

  const filtered = displayGroups.filter(
    (g) =>
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      (g.url ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const withUrl = activeGroups.filter((g) => g.url).length;
  const activeCount = activeGroups.filter((g) => g.isActive).length;

  async function handleImport() {
    startImport(async () => {
      const res = await fetch("/api/facebook-groups/import", { method: "POST" });
      const data = await res.json() as { created?: number; error?: string };
      if (res.ok) {
        setImportMsg(t("importSuccess", { count: data.created ?? 0 }));
        setImportMsgType("success");
        router.refresh();
        const refreshRes = await fetch("/api/facebook-groups?includeDeprecated=true");
        const refreshData = await refreshRes.json() as { groups?: FacebookGroup[] };
        if (refreshData.groups) setGroups(refreshData.groups);
      } else {
        setImportMsg(tErrors("importFailed", { error: data.error ?? "" }));
        setImportMsgType("error");
      }
    });
  }

  function handleCsvFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const rows = parseCsv(text);
      setCsvPreview({
        rows,
        withUrl: rows.filter((r) => r.url).length,
      });
    };
    reader.readAsText(file);
    // Reset input so same file can be re-selected
    e.target.value = "";
  }

  async function confirmCsvImport() {
    if (!csvPreview) return;
    setCsvImporting(true);
    try {
      const res = await fetch("/api/facebook-groups/import-csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groups: csvPreview.rows }),
      });
      const data = await res.json() as { created?: number; skipped?: number; error?: string };
      if (res.ok) {
        setImportMsg(`Imported ${data.created} groups · ${data.skipped} skipped (already exist).`);
        setImportMsgType("success");
        const refreshRes = await fetch("/api/facebook-groups?includeDeprecated=true");
        const refreshData = await refreshRes.json() as { groups?: FacebookGroup[] };
        if (refreshData.groups) setGroups(refreshData.groups);
      } else {
        setImportMsg(data.error ?? "Import failed.");
        setImportMsgType("error");
      }
    } finally {
      setCsvImporting(false);
      setCsvPreview(null);
    }
  }

  async function findMissingUrls() {
    const missing = activeGroups.filter((g) => !g.url);
    if (missing.length === 0) return;

    setFindUrlsOpen(true);
    setFindUrlsRunning(true);
    setFindUrlsResults([]);
    setFindUrlsProgress(0);
    setFindUrlsTotal(missing.length);

    // Process in batches of 10 to show incremental progress
    const BATCH = 10;
    const allResults: FoundUrlResult[] = [];

    for (let i = 0; i < missing.length; i += BATCH) {
      const batch = missing.slice(i, i + BATCH);
      const ids = batch.map((g) => g.id);

      const res = await fetch("/api/facebook-groups/find-urls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      const data = await res.json() as { results?: FoundUrlResult[]; error?: string };

      if (!res.ok) {
        setFindUrlsRunning(false);
        setImportMsg(data.error ?? "Search failed.");
        setImportMsgType("error");
        setFindUrlsOpen(false);
        return;
      }

      const batchResults = (data.results ?? []).map((r) => ({
        ...r,
        accepted: r.foundUrl !== null,
      }));
      allResults.push(...batchResults);
      setFindUrlsResults([...allResults]);
      setFindUrlsProgress(Math.min(i + BATCH, missing.length));
    }

    setFindUrlsRunning(false);
  }

  async function applyFoundUrls() {
    const toApply = findUrlsResults.filter((r) => r.accepted && r.foundUrl);
    if (toApply.length === 0) return;

    setFindUrlsApplying(true);
    let applied = 0;

    for (const result of toApply) {
      const res = await fetch(`/api/facebook-groups/${result.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: result.foundUrl }),
      });
      if (res.ok) {
        setGroups((prev) =>
          prev.map((g) => (g.id === result.id ? { ...g, url: result.foundUrl! } : g))
        );
        applied++;
      }
    }

    setFindUrlsApplying(false);
    setFindUrlsOpen(false);
    setFindUrlsResults([]);
    setImportMsg(`Added URLs to ${applied} group${applied !== 1 ? "s" : ""}.`);
    setImportMsgType("success");
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!addName.trim()) return;
    setAddLoading(true);
    const res = await fetch("/api/facebook-groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: addName, url: addUrl || null }),
    });
    const data = await res.json() as { group?: FacebookGroup };
    if (res.ok && data.group) {
      setGroups((prev) => [...prev, data.group!]);
      setAddName("");
      setAddUrl("");
    }
    setAddLoading(false);
  }

  async function handleToggleActive(group: FacebookGroup) {
    const res = await fetch(`/api/facebook-groups/${group.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !group.isActive }),
    });
    if (res.ok) {
      setGroups((prev) =>
        prev.map((g) => (g.id === group.id ? { ...g, isActive: !g.isActive } : g))
      );
    }
  }

  async function handleSaveUrl(id: string) {
    const res = await fetch(`/api/facebook-groups/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: editUrl }),
    });
    if (res.ok) {
      setGroups((prev) =>
        prev.map((g) => (g.id === id ? { ...g, url: editUrl || null } : g))
      );
      setEditingId(null);
    }
  }

  async function handleDeprecate(group: FacebookGroup) {
    const res = await fetch(`/api/facebook-groups/${group.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        isDeprecated: true,
        deprecationReason: deprecateReason.trim() || "Manually deprecated",
      }),
    });
    if (res.ok) {
      setGroups((prev) =>
        prev.map((g) =>
          g.id === group.id
            ? { ...g, isDeprecated: true, deprecationReason: deprecateReason.trim() || "Manually deprecated" }
            : g
        )
      );
      setDeprecatingId(null);
      setDeprecateReason("");
    }
  }

  async function handleRestore(group: FacebookGroup) {
    const res = await fetch(`/api/facebook-groups/${group.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDeprecated: false }),
    });
    if (res.ok) {
      setGroups((prev) =>
        prev.map((g) =>
          g.id === group.id ? { ...g, isDeprecated: false, deprecationReason: null } : g
        )
      );
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(t("confirmDelete"))) return;
    const res = await fetch(`/api/facebook-groups/${id}`, { method: "DELETE" });
    if (res.ok) {
      setGroups((prev) => prev.filter((g) => g.id !== id));
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {activeGroups.length} {t("active")} · {withUrl} {t("withUrl")} · {deprecatedGroups.length} {t("deprecated")}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {groups.length === 0 && (
            <Button onClick={handleImport} disabled={importPending} variant="outline">
              <DownloadCloud className="h-4 w-4" />
              {importPending ? t("importing") : t("importFromDocs")}
            </Button>
          )}
          {/* CSV import */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt"
            className="hidden"
            onChange={handleCsvFile}
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            <FileSpreadsheet className="h-4 w-4" />
            {t("importFromExcel")}
          </Button>
          {activeGroups.filter((g) => !g.url).length > 0 && (
            <Button
              variant="outline"
              onClick={findMissingUrls}
              disabled={findUrlsRunning}
            >
              <Wand2 className="h-4 w-4" />
              {t("findMissingUrls")} ({activeGroups.filter((g) => !g.url).length})
            </Button>
          )}
        </div>
      </div>

      {/* Import messages */}
      {importMsg && (
        <div className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
          importMsgType === "success"
            ? "border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400"
            : "border-destructive/30 bg-destructive/5 text-destructive"
        }`}>
          {importMsgType === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          {importMsg}
        </div>
      )}

      {/* CSV preview */}
      {csvPreview && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 px-4 py-4 space-y-3">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-amber-600 shrink-0" />
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
              Found {csvPreview.rows.length} groups — {csvPreview.withUrl} with URLs, {csvPreview.rows.length - csvPreview.withUrl} without
            </p>
          </div>
          <p className="text-xs text-amber-700 dark:text-amber-400">
            Duplicates (by name) will be skipped. New groups will be added with source &ldquo;Excel&rdquo;.
          </p>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={confirmCsvImport} disabled={csvImporting}>
              {csvImporting ? "Importing…" : `Import ${csvPreview.rows.length} groups`}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setCsvPreview(null)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Stats */}
      {groups.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground">{t("totalGroups")}</p>
              <p className="text-2xl font-bold">{activeGroups.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground">{t("withUrl")}</p>
              <p className="text-2xl font-bold text-emerald-600">{withUrl}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground">{t("needsUrl")}</p>
              <p className="text-2xl font-bold text-amber-600">{activeGroups.length - withUrl}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground">{t("deprecated")}</p>
              <p className="text-2xl font-bold text-red-500">{deprecatedGroups.length}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Find URLs panel */}
      {findUrlsOpen && (
        <Card className="border-primary/30">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Wand2 className="h-4 w-4 text-primary" />
                {t("findMissingUrls")}
              </CardTitle>
              {!findUrlsRunning && (
                <button
                  onClick={() => { setFindUrlsOpen(false); setFindUrlsResults([]); }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Progress */}
            {findUrlsRunning && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("searchingGoogle")}… {findUrlsProgress}/{findUrlsTotal}
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300 rounded-full"
                    style={{ width: `${findUrlsTotal ? (findUrlsProgress / findUrlsTotal) * 100 : 0}%` }}
                  />
                </div>
              </div>
            )}

            {/* Results */}
            {findUrlsResults.length > 0 && (
              <div className="space-y-3">
                {!findUrlsRunning && (
                  <p className="text-sm text-muted-foreground">
                    {t("foundUrlsFor")} {findUrlsResults.filter((r) => r.foundUrl).length} {t("of")} {findUrlsResults.length} groups.
                  </p>
                )}
                <div className="space-y-1 max-h-72 overflow-y-auto border rounded-lg divide-y">
                  {findUrlsResults.map((result) => (
                    <div key={result.id} className="flex items-start gap-3 px-3 py-2.5">
                      {result.foundUrl ? (
                        <input
                          type="checkbox"
                          checked={result.accepted ?? true}
                          onChange={(e) =>
                            setFindUrlsResults((prev) =>
                              prev.map((r) => r.id === result.id ? { ...r, accepted: e.target.checked } : r)
                            )
                          }
                          className="mt-0.5 rounded shrink-0"
                        />
                      ) : (
                        <span className="mt-0.5 h-4 w-4 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{result.name}</p>
                        {result.foundUrl ? (
                          <a
                            href={result.foundUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary underline underline-offset-2 hover:no-underline truncate block"
                          >
                            {result.foundUrl}
                          </a>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            {result.error ? `Error: ${result.error}` : "Not found"}
                          </p>
                        )}
                      </div>
                      {result.foundUrl ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-muted-foreground/40 shrink-0 mt-0.5" />
                      )}
                    </div>
                  ))}
                </div>

                {!findUrlsRunning && findUrlsResults.some((r) => r.foundUrl && r.accepted) && (
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={applyFoundUrls}
                      disabled={findUrlsApplying}
                    >
                      {findUrlsApplying ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Applying…</>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          Apply {findUrlsResults.filter((r) => r.foundUrl && r.accepted).length} URLs
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => { setFindUrlsOpen(false); setFindUrlsResults([]); }}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add group form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("addGroupManually")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder={t("groupNamePlaceholder")}
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
              className="flex-1"
              required
            />
            <Input
              placeholder={t("facebookUrlPlaceholder")}
              value={addUrl}
              onChange={(e) => setAddUrl(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={addLoading} className="shrink-0">
              <Plus className="h-4 w-4" />
              {t("add")}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Search + deprecated toggle */}
      {groups.length > 0 && (
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("searchGroups")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          {deprecatedGroups.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeprecated(!showDeprecated)}
              className="shrink-0"
            >
              {showDeprecated ? (
                <><EyeOff className="h-4 w-4" /> {t("hideDeprecated")}</>
              ) : (
                <><Eye className="h-4 w-4" /> {t("showDeprecated")} ({deprecatedGroups.length})</>
              )}
            </Button>
          )}
        </div>
      )}

      {/* CSV import hint */}
      <p className="text-xs text-muted-foreground -mt-2">
        To import from Excel: open your file in Excel/Sheets → File → Save as CSV → import the CSV here. Expected columns: Name, URL.
      </p>

      {/* Groups list */}
      {groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center space-y-3">
          <Users className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No groups yet.</p>
          <Button onClick={handleImport} disabled={importPending} variant="outline" size="sm">
            <DownloadCloud className="h-4 w-4" />
            {importPending ? "Importing…" : "Import 99 groups from docs"}
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Group Name</th>
                <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">URL</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Source</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((group) => (
                <>
                  <tr
                    key={group.id}
                    className={`${
                      group.isDeprecated
                        ? "opacity-40 bg-muted/20"
                        : group.isActive
                        ? ""
                        : "opacity-50"
                    } hover:bg-muted/20 transition-colors`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {group.isDeprecated ? (
                          <Ban className="h-3.5 w-3.5 text-red-500 shrink-0" />
                        ) : group.url ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        ) : (
                          <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                        )}
                        <span className={`font-medium truncate max-w-[200px] ${group.isDeprecated ? "line-through" : ""}`}>
                          {group.name}
                        </span>
                        {group.isDeprecated && (
                          <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4 shrink-0">
                            DEPRECATED
                          </Badge>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3 hidden sm:table-cell">
                      {group.isDeprecated ? (
                        <span className="text-xs text-muted-foreground italic">
                          {group.deprecationReason ?? "Deprecated"}
                        </span>
                      ) : editingId === group.id ? (
                        <div className="flex items-center gap-1">
                          <Input
                            value={editUrl}
                            onChange={(e) => setEditUrl(e.target.value)}
                            placeholder="https://facebook.com/groups/..."
                            className="h-7 text-xs w-60"
                            autoFocus
                          />
                          <Button size="sm" className="h-7 px-2 text-xs" onClick={() => handleSaveUrl(group.id)}>
                            Save
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setEditingId(null)}>
                            ✕
                          </Button>
                        </div>
                      ) : group.url ? (
                        <div className="flex items-center gap-1">
                          <a
                            href={group.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary underline underline-offset-2 truncate max-w-[180px] hover:no-underline"
                          >
                            {group.url.replace("https://www.facebook.com/groups/", "groups/")}
                          </a>
                          <button
                            onClick={() => {
                              setEditingId(group.id);
                              setEditUrl(group.url ?? "");
                            }}
                            className="text-muted-foreground hover:text-foreground p-0.5"
                          >
                            <Link2 className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingId(group.id);
                            setEditUrl("");
                          }}
                          className="text-xs text-amber-600 hover:text-amber-700 flex items-center gap-1"
                        >
                          <Link2Off className="h-3 w-3" />
                          Add URL
                        </button>
                      )}
                    </td>

                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs text-muted-foreground">
                        {group.source === "doc1"
                          ? "Doc 1"
                          : group.source === "doc2"
                          ? "Doc 2"
                          : group.source === "excel"
                          ? "Excel"
                          : "Manual"}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {!group.isDeprecated && group.url && (
                          <a
                            href={group.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                        {!group.isDeprecated && (
                          <button
                            onClick={() => handleToggleActive(group)}
                            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors text-xs"
                            title={group.isActive ? "Deactivate" : "Activate"}
                          >
                            {group.isActive ? "On" : "Off"}
                          </button>
                        )}
                        {group.isDeprecated ? (
                          <button
                            onClick={() => handleRestore(group)}
                            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-emerald-600 transition-colors"
                            title={t("tooltipRestore")}
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setDeprecatingId(group.id);
                              setDeprecateReason("");
                            }}
                            className="p-1.5 rounded hover:bg-amber-50 text-muted-foreground hover:text-amber-600 transition-colors"
                            title={t("tooltipDeprecate")}
                          >
                            <Ban className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(group.id)}
                          className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Inline deprecation form */}
                  {deprecatingId === group.id && (
                    <tr key={`deprecate-${group.id}`} className="bg-amber-50 dark:bg-amber-950/20">
                      <td colSpan={4} className="px-4 py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Ban className="h-4 w-4 text-amber-600 shrink-0" />
                          <span className="text-xs font-medium text-amber-700">Deprecation reason (optional):</span>
                          <Input
                            value={deprecateReason}
                            onChange={(e) => setDeprecateReason(e.target.value)}
                            placeholder="e.g. Group was terminated, URL no longer works…"
                            className="h-7 text-xs flex-1 min-w-[200px]"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleDeprecate(group);
                              if (e.key === "Escape") { setDeprecatingId(null); setDeprecateReason(""); }
                            }}
                          />
                          <Button
                            size="sm"
                            className="h-7 px-3 text-xs bg-amber-600 hover:bg-amber-700 text-white"
                            onClick={() => handleDeprecate(group)}
                          >
                            Confirm
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2"
                            onClick={() => { setDeprecatingId(null); setDeprecateReason(""); }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && search && (
            <p className="text-center py-8 text-sm text-muted-foreground">No groups match your search.</p>
          )}
          {filtered.length === 0 && !search && showDeprecated && (
            <p className="text-center py-8 text-sm text-muted-foreground">No deprecated groups.</p>
          )}
        </div>
      )}
    </div>
  );
}
