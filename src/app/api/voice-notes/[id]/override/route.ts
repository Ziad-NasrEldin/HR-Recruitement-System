import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ValidationStatus } from "@/generated/prisma/client";

const VALID_STATUSES: ValidationStatus[] = ["PENDING", "APPROVED", "REJECTED"];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only super admins (Team Leaders) can override AI decisions
  if (session.user.role !== "SUPER_ADMIN") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const voiceNote = await prisma.voiceNote.findUnique({ where: { id } });
  if (!voiceNote) {
    return Response.json({ error: "Voice note not found" }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { validationStatus, validatorNotes } = body as {
    validationStatus?: ValidationStatus;
    validatorNotes?: string;
  };

  if (validationStatus && !VALID_STATUSES.includes(validationStatus)) {
    return Response.json(
      { error: `validationStatus must be one of: ${VALID_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    const updated = await prisma.voiceNote.update({
      where: { id },
      data: {
        ...(validationStatus ? { validationStatus } : {}),
        ...(validatorNotes !== undefined ? { validatorNotes } : {}),
      },
    });
    return Response.json({ voiceNote: updated });
  } catch (err) {
    console.error("Override voice note error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
