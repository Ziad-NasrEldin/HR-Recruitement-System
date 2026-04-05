import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { CommissionStatus } from "@/generated/prisma/client";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status") as CommissionStatus | null;
  const recruiterId = searchParams.get("recruiterId");
  const offerId = searchParams.get("offerId");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = parseInt(searchParams.get("limit") ?? "20", 10);
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  // Recruiters see only their own commissions
  if (session.user.role === "RECRUITER") {
    where.recruiterId = session.user.id;
  } else if (recruiterId) {
    where.recruiterId = recruiterId;
  }

  if (status) where.status = status;
  if (offerId) where.offerId = offerId;

  if (dateFrom || dateTo) {
    where.createdAt = {
      ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
      ...(dateTo ? { lte: new Date(dateTo) } : {}),
    };
  }

  const [commissions, total] = await Promise.all([
    prisma.commission.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        lead: { select: { id: true, name: true, phone: true } },
        recruiter: { select: { id: true, name: true } },
        offer: { select: { id: true, company: true, accountType: true, language: true } },
      },
    }),
    prisma.commission.count({ where }),
  ]);

  return Response.json({
    commissions,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
}
