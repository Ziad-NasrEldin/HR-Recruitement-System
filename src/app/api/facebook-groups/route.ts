import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "SUPER_ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });

  const includeDeprecated = request.nextUrl.searchParams.get("includeDeprecated") === "true";

  const groups = await prisma.facebookGroup.findMany({
    where: includeDeprecated ? undefined : { isDeprecated: false },
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
  });

  return Response.json({ groups });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "SUPER_ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { name, url } = body as { name?: string; url?: string };
  if (!name?.trim()) return Response.json({ error: "name is required" }, { status: 400 });

  const group = await prisma.facebookGroup.create({
    data: {
      name: name.trim(),
      url: url?.trim() || null,
      source: "manual",
    },
  });

  return Response.json({ group }, { status: 201 });
}
