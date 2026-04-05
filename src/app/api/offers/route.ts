import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { OfferStatus, WorkModel } from "@/generated/prisma/client";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status") as OfferStatus | null;
  const language = searchParams.get("language");
  const workModel = searchParams.get("workModel") as WorkModel | null;
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = parseInt(searchParams.get("limit") ?? "12", 10);
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (language) where.language = { contains: language, mode: "insensitive" };
  if (workModel) where.workModel = workModel;

  const [offers, total] = await Promise.all([
    prisma.offer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        _count: { select: { leads: true } },
      },
    }),
    prisma.offer.count({ where }),
  ]);

  return Response.json({
    offers,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "SUPER_ADMIN") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    company,
    language,
    accountType,
    graduationRequirement,
    location,
    workModel,
    salaryMin,
    salaryMax,
    salaryCurrency,
    workingHours,
    shift,
    daysOff,
    benefits,
    interviewProcess,
    formLink,
    commissionAmount,
    commissionCurrency,
    commissionPeriodDays,
    requirements,
  } = body as Record<string, string>;

  if (
    !company ||
    !language ||
    !accountType ||
    !location ||
    !workModel ||
    !workingHours ||
    !shift ||
    !daysOff ||
    !benefits ||
    !interviewProcess
  ) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const offer = await prisma.offer.create({
      data: {
        company,
        language,
        accountType,
        graduationRequirement: (graduationRequirement as "GRADUATE" | "UNDERGRADUATE" | "ANY") ?? "ANY",
        location,
        workModel: workModel as "WFH" | "ON_SITE" | "HYBRID",
        salaryDetails: {
          min: parseFloat(salaryMin ?? "0"),
          max: parseFloat(salaryMax ?? "0"),
          currency: salaryCurrency ?? "EGP",
        },
        workingHours,
        shift,
        daysOff,
        benefits,
        interviewProcess,
        formLink: formLink || null,
        commissionAmount: commissionAmount ? parseFloat(commissionAmount) : 0,
        commissionCurrency: commissionCurrency ?? "EGP",
        commissionPeriodDays: commissionPeriodDays ? parseInt(commissionPeriodDays, 10) : 30,
        requirements: requirements || null,
      },
    });
    return Response.json({ offer }, { status: 201 });
  } catch (err) {
    console.error("Create offer error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
