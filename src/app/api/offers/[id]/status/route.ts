import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "SUPER_ADMIN") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const existing = await prisma.offer.findUnique({ where: { id } });
  if (!existing) {
    return Response.json({ error: "Offer not found" }, { status: 404 });
  }

  const newStatus = existing.status === "ACTIVE" ? "ON_HOLD" : "ACTIVE";

  try {
    const offer = await prisma.offer.update({
      where: { id },
      data: { status: newStatus },
    });
    return Response.json({ offer });
  } catch (err) {
    console.error("Toggle status error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
