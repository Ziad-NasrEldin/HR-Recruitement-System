import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  // Upcoming = due in the next 7 days (or overdue), not yet completed
  const upcomingCutoff = new Date(now);
  upcomingCutoff.setDate(upcomingCutoff.getDate() + 7);

  const where =
    session.user.role === "RECRUITER"
      ? { recruiterId: session.user.id }
      : {};

  const reminders = await prisma.followUpReminder.findMany({
    where: {
      ...where,
      isCompleted: false,
      dueDate: { lte: upcomingCutoff },
    },
    orderBy: { dueDate: "asc" },
    take: 50,
    include: {
      lead: { select: { id: true, name: true, phone: true } },
      recruiter: { select: { id: true, name: true } },
    },
  });

  // Split into overdue and upcoming
  const overdue = reminders.filter((r) => r.dueDate < now);
  const upcoming = reminders.filter((r) => r.dueDate >= now);

  return Response.json({ reminders, overdue, upcoming });
}
