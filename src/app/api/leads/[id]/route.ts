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

  const lead = await prisma.lead.findUnique({
    where: { id },
    include: {
      recruiter: { select: { id: true, name: true, email: true } },
      offer: { select: { id: true, company: true, accountType: true, language: true, commissionAmount: true, commissionPeriodDays: true } },
      voiceNotes: { orderBy: { createdAt: "asc" } },
      followUpReminders: { orderBy: { dueDate: "asc" } },
      commission: true,
    },
  });

  if (!lead) {
    return Response.json({ error: "Lead not found" }, { status: 404 });
  }

  // Recruiters can only see their own leads
  if (session.user.role === "RECRUITER" && lead.recruiterId !== session.user.id) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  return Response.json({ lead });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.lead.findUnique({ where: { id } });
  if (!existing) {
    return Response.json({ error: "Lead not found" }, { status: 404 });
  }

  if (session.user.role === "RECRUITER" && existing.recruiterId !== session.user.id) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
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

  try {
    const lead = await prisma.lead.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(phone && { phone }),
        email: email !== undefined ? email || null : undefined,
        whatsappNumber: whatsappNumber !== undefined ? whatsappNumber || null : undefined,
        ...(language && { language }),
        languageLevel: languageLevel !== undefined ? languageLevel || null : undefined,
        ...(graduationStatus && { graduationStatus }),
        militaryStatus: militaryStatus !== undefined ? militaryStatus || null : undefined,
        ...(location && { location }),
        previousApplications: previousApplications !== undefined ? previousApplications || null : undefined,
        offerId: offerId !== undefined ? offerId || null : undefined,
        notes: notes !== undefined ? notes || null : undefined,
      },
    });
    return Response.json({ lead });
  } catch (err) {
    console.error("Update lead error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
