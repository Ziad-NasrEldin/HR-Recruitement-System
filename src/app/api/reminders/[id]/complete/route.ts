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

  const { id } = await params;

  const reminder = await prisma.followUpReminder.findUnique({ where: { id } });
  if (!reminder) {
    return Response.json({ error: "Reminder not found" }, { status: 404 });
  }

  // Recruiters can only mark their own reminders
  if (session.user.role === "RECRUITER" && reminder.recruiterId !== session.user.id) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const updated = await prisma.followUpReminder.update({
      where: { id },
      data: { isCompleted: true, completedAt: new Date() },
    });
    return Response.json({ reminder: updated });
  } catch (err) {
    console.error("Complete reminder error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
