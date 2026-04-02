import type {
  Role,
  OfferStatus,
  GradReq,
  WorkModel,
  LeadStatus,
  ValidationStatus,
  ReminderType,
  CommissionStatus,
} from "@/generated/prisma/client";

export type {
  Role,
  OfferStatus,
  GradReq,
  WorkModel,
  LeadStatus,
  ValidationStatus,
  ReminderType,
  CommissionStatus,
};

export const LEAD_STATUS_ORDER: LeadStatus[] = [
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

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  SOURCED: "Sourced",
  CONTACTED: "Contacted",
  VOICE_NOTE_SENT: "Voice Note Sent",
  VALIDATED: "Validated",
  INTERVIEW_SCHEDULED: "Interview Scheduled",
  INTERVIEWED: "Interviewed",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  IN_TRAINING: "In Training",
  COMMISSION_ELIGIBLE: "Commission Eligible",
  COMMISSION_PAID: "Commission Paid",
};

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  RECRUITER: "Recruiter",
};

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: Role;
      isActive: boolean;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: Role;
    isActive: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    isActive: boolean;
  }
}
