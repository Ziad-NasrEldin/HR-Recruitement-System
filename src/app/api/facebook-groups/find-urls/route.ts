import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface SearchResult {
  id: string;
  name: string;
  foundUrl: string | null;
  error?: string;
}

/** Extract a clean Facebook group URL from a raw link */
function extractGroupUrl(link: string): string | null {
  try {
    const url = new URL(link);
    if (!url.hostname.includes("facebook.com")) return null;
    if (!url.pathname.includes("/groups/")) return null;
    const parts = url.pathname.split("/").filter(Boolean);
    const groupsIdx = parts.indexOf("groups");
    if (groupsIdx === -1 || !parts[groupsIdx + 1]) return null;
    return `https://www.facebook.com/groups/${parts[groupsIdx + 1]}`;
  } catch {
    return null;
  }
}

/** Search DuckDuckGo HTML for a Facebook group URL — no API key required */
async function searchGroupUrl(groupName: string): Promise<{ url: string | null; error?: string }> {
  try {
    const query = encodeURIComponent(`"${groupName}" site:facebook.com/groups`);
    const res = await fetch(`https://html.duckduckgo.com/html/?q=${query}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: AbortSignal.timeout(12000),
    });

    if (!res.ok) return { url: null, error: `Search returned HTTP ${res.status}` };

    const html = await res.text();

    // Extract facebook.com/groups URLs from the result HTML
    const matches = html.match(/https?:\/\/(?:www\.)?facebook\.com\/groups\/[^\s"'<>&?#]+/g);
    if (!matches || matches.length === 0) return { url: null };

    for (const match of matches) {
      const clean = extractGroupUrl(match);
      if (clean) return { url: clean };
    }

    return { url: null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Request failed";
    return { url: null, error: msg };
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "SUPER_ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });

  let body: { ids?: string[] };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { ids } = body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return Response.json({ error: "ids array is required" }, { status: 400 });
  }

  const groups = await prisma.facebookGroup.findMany({
    where: { id: { in: ids }, url: null, isDeprecated: false },
    select: { id: true, name: true },
  });

  const results: SearchResult[] = [];

  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    const { url, error } = await searchGroupUrl(group.name);
    results.push({ id: group.id, name: group.name, foundUrl: url, error });

    // Respect DuckDuckGo rate limits — 1s gap between requests
    if (i < groups.length - 1) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  return Response.json({ results });
}
