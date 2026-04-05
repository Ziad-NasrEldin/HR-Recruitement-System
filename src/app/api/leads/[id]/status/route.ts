import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { LeadStatus } from "@/generated/prisma/client";

const VALID_STATUSES: LeadStatus[] = [
  "SOURCED",
  "CONTACTED",
  "VOICE_NOTE_SENT",
  "VALIDATED",
  "INTERVIEW_SCHEDULED",
  "INTERVIEWED",
  "ACCEPTED",
  "REJECTED",
  "IN_TRAINING",
  "COMMISSION_ELIGIBLE",
  "COMMISSION_PAID",
];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const lead = await prisma.lead.findUnique({
    where: { id },
    include: { offer: true },
  });

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

  const { status, interviewDate } = body as { status: LeadStatus; interviewDate?: string };

  if (!status || !VALID_STATUSES.includes(status)) {
    return Response.json({ error: "Invalid status" }, { status: 400 });
  }

  try {
    let updatedLead;

    if (status === "INTERVIEW_SCHEDULED") {
      if (!interviewDate) {
        return Response.json({ error: "interviewDate is required for INTERVIEW_SCHEDULED" }, { status: 400 });
      }
      const parsedInterview = new Date(interviewDate);
      if (isNaN(parsedInterview.getTime())) {
        return Response.json({ error: "Invalid interviewDate" }, { status: 400 });
      }
      const reminderDue = new Date(parsedInterview);
      reminderDue.setDate(reminderDue.getDate() - 1);

      updatedLead = await prisma.$transaction(async (tx) => {
        const updated = await tx.lead.update({
          where: { id },
          data: { status, interviewDate: parsedInterview },
        });
        await tx.followUpReminder.create({
          data: {
            leadId: id,
            recruiterId: lead.recruiterId,
            type: "PRE_INTERVIEW",
            dueDate: reminderDue,
          },
        });
        return updated;
      });
    } else if (status === "INTERVIEWED") {
      const now = new Date();
      const day10 = new Date(now);
      day10.setDate(day10.getDate() + 10);

      updatedLead = await prisma.$transaction(async (tx) => {
        const updated = await tx.lead.update({
          where: { id },
          data: { status },
        });
        await tx.followUpReminder.create({
          data: { leadId: id, recruiterId: lead.recruiterId, type: "POST_INTERVIEW", dueDate: now },
        });
        await tx.followUpReminder.create({
          data: { leadId: id, recruiterId: lead.recruiterId, type: "DAY_10", dueDate: day10 },
        });
        return updated;
      });
    } else if (status === "IN_TRAINING") {
      const trainingStartDate = new Date();
      const day15 = new Date(trainingStartDate);
      day15.setDate(day15.getDate() + 15);
      const day30 = new Date(trainingStartDate);
      day30.setDate(day30.getDate() + 30);

      updatedLead = await prisma.$transaction(async (tx) => {
        const updated = await tx.lead.update({
          where: { id },
          data: { status, trainingStartDate },
        });
        await tx.followUpReminder.create({
          data: { leadId: id, recruiterId: lead.recruiterId, type: "DAY_15", dueDate: day15 },
        });
        await tx.followUpReminder.create({
          data: { leadId: id, recruiterId: lead.recruiterId, type: "DAY_30", dueDate: day30 },
        });
        return updated;
      });
    } else if (status === "COMMISSION_ELIGIBLE") {
      const commissionEligibleDate = new Date();

      updatedLead = await prisma.$transaction(async (tx) => {
        const updated = await tx.lead.update({
          where: { id },
          data: { status, commissionEligibleDate },
        });
        // Create commission record only if there is a linked offer
        if (lead.offerId && lead.offer) {
          await tx.commission.upsert({
            where: { leadId: id },
            create: {
              leadId: id,
              recruiterId: lead.recruiterId,
              offerId: lead.offerId,
              amount: lead.offer.commissionAmount,
              status: "PENDING",
              eligibleDate: commissionEligibleDate,
            },
            update: {
              status: "PENDING",
              eligibleDate: commissionEligibleDate,
            },
          });
        }
        return updated;
      });
    } else {
      updatedLead = await prisma.lead.update({
        where: { id },
        data: { status },
      });
    }

    return Response.json({ lead: updatedLead });
  } catch (err) {
    console.error("Update lead status error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
