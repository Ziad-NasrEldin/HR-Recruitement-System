import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "SUPER_ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { name, url, isActive } = body as { name?: string; url?: string; isActive?: boolean };

  const group = await prisma.facebookGroup.update({
    where: { id },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(url !== undefined && { url: url.trim() || null }),
      ...(isActive !== undefined && { isActive }),
    },
  });

  return Response.json({ group });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "SUPER_ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  await prisma.facebookGroup.delete({ where: { id } });

  return Response.json({ success: true });
}
