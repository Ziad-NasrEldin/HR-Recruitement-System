"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FacebookGroup {
  id: string;
  name: string;
  url: string | null;
  isActive: boolean;
  source: string | null;
  createdAt: Date | string;
}

interface Props {
  initialGroups: FacebookGroup[];
}

export function FacebookGroupsClient({ initialGroups }: Props) {
  const router = useRouter();
  const [groups, setGroups] = useState(initialGroups);
  const [search, setSearch] = useState("");
  const [importPending, startImport] = useTransition();
  const [importMsg, setImportMsg] = useState<string | null>(null);

  // Add group form
  const [addName, setAddName] = useState("");
  const [addUrl, setAddUrl] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  // Inline URL edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editUrl, setEditUrl] = useState("");

  const filtered = groups.filter(
    (g) =>
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      (g.url ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const withUrl = groups.filter((g) => g.url).length;
  const active = groups.filter((g) => g.isActive).length;

  async function handleImport() {
    startImport(async () => {
      const res = await fetch("/api/facebook-groups/import", { method: "POST" });
      const data = await res.json() as { created?: number; error?: string };
      if (res.ok) {
        setImportMsg(`Imported ${data.created} groups successfully.`);
        router.refresh();
        const refreshRes = await fetch("/api/facebook-groups");
        const refreshData = await refreshRes.json() as { groups?: FacebookGroup[] };
        if (refreshData.groups) setGroups(refreshData.groups);
      } else {
        setImportMsg(data.error ?? "Import failed.");
      }
    });
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

  async function handleDelete(id: string) {
    if (!confirm("Delete this group?")) return;
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
            Facebook Groups
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {groups.length} groups · {withUrl} with URL · {active} active
          </p>
        </div>

        {groups.length === 0 && (
          <Button onClick={handleImport} disabled={importPending} variant="outline">
            <DownloadCloud className="h-4 w-4" />
            {importPending ? "Importing…" : "Import from docs"}
          </Button>
        )}
      </div>

      {importMsg && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {importMsg}
        </div>
      )}

      {/* Stats */}
      {groups.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{groups.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground">With URL</p>
              <p className="text-2xl font-bold text-emerald-600">{withUrl}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground">Needs URL</p>
              <p className="text-2xl font-bold text-amber-600">{groups.length - withUrl}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground">Active</p>
              <p className="text-2xl font-bold">{active}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add group form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add Group Manually</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Group name"
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
              className="flex-1"
              required
            />
            <Input
              placeholder="Facebook URL (optional)"
              value={addUrl}
              onChange={(e) => setAddUrl(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={addLoading} className="shrink-0">
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Search */}
      {groups.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search groups…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

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
                <tr
                  key={group.id}
                  className={`${
                    group.isActive ? "" : "opacity-50"
                  } hover:bg-muted/20 transition-colors`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {group.url ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      ) : (
                        <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      )}
                      <span className="font-medium truncate max-w-[200px]">{group.name}</span>
                    </div>
                  </td>

                  <td className="px-4 py-3 hidden sm:table-cell">
                    {editingId === group.id ? (
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
                      {group.source === "doc1" ? "Doc 1" : group.source === "doc2" ? "Doc 2" : "Manual"}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {group.url && (
                        <a
                          href={group.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                      <button
                        onClick={() => handleToggleActive(group)}
                        className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors text-xs"
                        title={group.isActive ? "Deactivate" : "Activate"}
                      >
                        {group.isActive ? "On" : "Off"}
                      </button>
                      <button
                        onClick={() => handleDelete(group.id)}
                        className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && search && (
            <p className="text-center py-8 text-sm text-muted-foreground">No groups match your search.</p>
          )}
        </div>
      )}
    </div>
  );
}
