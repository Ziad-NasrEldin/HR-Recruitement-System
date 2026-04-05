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

  const lead = await prisma.lead.findUnique({ where: { id }, select: { recruiterId: true } });
  if (!lead) {
    return Response.json({ error: "Lead not found" }, { status: 404 });
  }
  if (session.user.role === "RECRUITER" && lead.recruiterId !== session.user.id) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const voiceNotes = await prisma.voiceNote.findMany({
    where: { leadId: id },
    orderBy: { createdAt: "asc" },
  });

  return Response.json({ voiceNotes });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const lead = await prisma.lead.findUnique({ where: { id }, select: { recruiterId: true } });
  if (!lead) {
    return Response.json({ error: "Lead not found" }, { status: 404 });
  }
  if (session.user.role === "RECRUITER" && lead.recruiterId !== session.user.id) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { fileUrl, language, duration } = body as {
    fileUrl?: string;
    language?: string;
    duration?: number;
  };

  if (!fileUrl || !language) {
    return Response.json({ error: "fileUrl and language are required" }, { status: 400 });
  }

  try {
    const voiceNote = await prisma.voiceNote.create({
      data: {
        leadId: id,
        fileUrl,
        language,
        duration: duration ? parseInt(String(duration), 10) : null,
        validationStatus: "PENDING",
      },
    });
    return Response.json({ voiceNote }, { status: 201 });
  } catch (err) {
    console.error("Create voice note error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
