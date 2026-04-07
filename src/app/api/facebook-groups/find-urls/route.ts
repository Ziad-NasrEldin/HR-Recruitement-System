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
    // Must contain /groups/
    if (!url.pathname.includes("/groups/")) return null;
    // Rebuild clean URL: just origin + /groups/slug_or_id
    const parts = url.pathname.split("/").filter(Boolean);
    const groupsIdx = parts.indexOf("groups");
    if (groupsIdx === -1 || !parts[groupsIdx + 1]) return null;
    return `https://www.facebook.com/groups/${parts[groupsIdx + 1]}`;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "SUPER_ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });

  const apiKey = process.env.GOOGLE_CSE_KEY;
  const cx = process.env.GOOGLE_CSE_CX;

  if (!apiKey || !cx) {
    return Response.json(
      { error: "Google Custom Search is not configured. Add GOOGLE_CSE_KEY and GOOGLE_CSE_CX to your environment." },
      { status: 503 }
    );
  }

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
  if (ids.length > 100) {
    return Response.json({ error: "Maximum 100 groups per request (Google CSE free tier limit)" }, { status: 400 });
  }

  // Fetch group names from DB
  const groups = await prisma.facebookGroup.findMany({
    where: { id: { in: ids }, url: null, isDeprecated: false },
    select: { id: true, name: true },
  });

  const results: SearchResult[] = [];

  for (const group of groups) {
    try {
      const query = encodeURIComponent(`site:facebook.com/groups "${group.name}"`);
      const apiUrl = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${query}&num=1`;

      const res = await fetch(apiUrl);
      const data = await res.json() as {
        items?: { link: string }[];
        error?: { message: string };
      };

      if (!res.ok) {
        results.push({ id: group.id, name: group.name, foundUrl: null, error: data.error?.message ?? "Search failed" });
        continue;
      }

      const firstLink = data.items?.[0]?.link ?? null;
      const cleanUrl = firstLink ? extractGroupUrl(firstLink) : null;

      results.push({ id: group.id, name: group.name, foundUrl: cleanUrl });
    } catch {
      results.push({ id: group.id, name: group.name, foundUrl: null, error: "Network error" });
    }
  }

  return Response.json({ results });
}
