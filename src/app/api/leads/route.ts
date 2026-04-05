import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { LeadStatus } from "@/generated/prisma/client";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const search = searchParams.get("search");
  const status = searchParams.get("status") as LeadStatus | null;
  const offerId = searchParams.get("offerId");
  const recruiterId = searchParams.get("recruiterId");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = parseInt(searchParams.get("limit") ?? "20", 10);
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  // Scope to own leads for recruiters
  if (session.user.role === "RECRUITER") {
    where.recruiterId = session.user.id;
  } else if (recruiterId) {
    where.recruiterId = recruiterId;
  }

  if (status) where.status = status;
  if (offerId) where.offerId = offerId;

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
    ];
  }

  if (dateFrom || dateTo) {
    where.createdAt = {
      ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
      ...(dateTo ? { lte: new Date(dateTo) } : {}),
    };
  }

  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        recruiter: { select: { id: true, name: true } },
        offer: { select: { id: true, company: true, accountType: true, language: true } },
      },
    }),
    prisma.lead.count({ where }),
  ]);

  return Response.json({
    leads,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    name,
    phone,
    email,
    whatsappNumber,
    language,
    languageLevel,
    graduationStatus,
    militaryStatus,
    location,
    previousApplications,
    offerId,
    notes,
  } = body as Record<string, string | undefined>;

  if (!name || !phone || !language || !graduationStatus || !location) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const lead = await prisma.lead.create({
      data: {
        recruiterId: session.user.id,
        name,
        phone,
        email: email || null,
        whatsappNumber: whatsappNumber || null,
        language,
        languageLevel: languageLevel || null,
        graduationStatus,
        militaryStatus: militaryStatus || null,
        location,
        previousApplications: previousApplications || null,
        offerId: offerId || null,
        notes: notes || null,
        status: "SOURCED",
      },
    });
    return Response.json({ lead }, { status: 201 });
  } catch (err) {
    console.error("Create lead error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
