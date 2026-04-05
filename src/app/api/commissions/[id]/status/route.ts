import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { CommissionStatus } from "@/generated/prisma/client";

const VALID_STATUSES: CommissionStatus[] = ["PENDING", "ELIGIBLE", "PAID"];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only super admins can update commission status
  if (session.user.role !== "SUPER_ADMIN") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const commission = await prisma.commission.findUnique({ where: { id } });
  if (!commission) {
    return Response.json({ error: "Commission not found" }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { status } = body as { status: CommissionStatus };

  if (!status || !VALID_STATUSES.includes(status)) {
    return Response.json(
      { error: `Status must be one of: ${VALID_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    const updated = await prisma.commission.update({
      where: { id },
      data: {
        status,
        ...(status === "ELIGIBLE" ? { eligibleDate: new Date() } : {}),
        ...(status === "PAID" ? { paidDate: new Date() } : {}),
      },
      include: {
        lead: { select: { id: true, name: true } },
        recruiter: { select: { id: true, name: true } },
        offer: { select: { id: true, company: true } },
      },
    });
    return Response.json({ commission: updated });
  } catch (err) {
    console.error("Update commission status error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
