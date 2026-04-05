import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const offer = await prisma.offer.findUnique({
    where: { id },
    include: {
      _count: { select: { leads: true } },
    },
  });

  if (!offer) {
    return Response.json({ error: "Offer not found" }, { status: 404 });
  }

  return Response.json({ offer });
}

export async function PUT(
  request: NextRequest,
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

  try {
    const offer = await prisma.offer.update({
      where: { id },
      data: {
        ...(company && { company }),
        ...(language && { language }),
        ...(accountType && { accountType }),
        ...(graduationRequirement && {
          graduationRequirement: graduationRequirement as "GRADUATE" | "UNDERGRADUATE" | "ANY",
        }),
        ...(location && { location }),
        ...(workModel && { workModel: workModel as "WFH" | "ON_SITE" | "HYBRID" }),
        ...(salaryMin !== undefined &&
          salaryMax !== undefined && {
            salaryDetails: {
              min: parseFloat(salaryMin),
              max: parseFloat(salaryMax),
              currency: salaryCurrency ?? "EGP",
            },
          }),
        ...(workingHours && { workingHours }),
        ...(shift && { shift }),
        ...(daysOff && { daysOff }),
        ...(benefits && { benefits }),
        ...(interviewProcess && { interviewProcess }),
        formLink: formLink || null,
        ...(commissionAmount !== undefined && {
          commissionAmount: commissionAmount ? parseFloat(commissionAmount) : 0,
        }),
        ...(commissionCurrency && { commissionCurrency }),
        ...(commissionPeriodDays !== undefined && {
          commissionPeriodDays: commissionPeriodDays ? parseInt(commissionPeriodDays, 10) : 30,
        }),
        requirements: requirements || null,
      },
    });
    return Response.json({ offer });
  } catch (err) {
    console.error("Update offer error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
