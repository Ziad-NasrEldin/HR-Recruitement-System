import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface GroupRow {
  name: string;
  url?: string;
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "SUPER_ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });

  let body: { groups?: GroupRow[] };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const rows = body.groups;
  if (!Array.isArray(rows) || rows.length === 0) {
    return Response.json({ error: "No groups provided" }, { status: 400 });
  }

  // Deduplicate incoming rows by name
  const seen = new Set<string>();
  const unique = rows.filter((r) => {
    const key = r.name?.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Fetch existing names to count skips
  const existingNames = await prisma.facebookGroup.findMany({
    select: { name: true },
  });
  const existingSet = new Set(existingNames.map((g) => g.name.toLowerCase()));

  const toInsert = unique.filter((r) => !existingSet.has(r.name.trim().toLowerCase()));
  const skipped = unique.length - toInsert.length;

  if (toInsert.length > 0) {
    await prisma.facebookGroup.createMany({
      data: toInsert.map((r) => ({
        name: r.name.trim(),
        url: r.url?.trim() || null,
        source: "excel",
      })),
      skipDuplicates: true,
    });
  }

  return Response.json({ created: toInsert.length, skipped });
}
