-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'RECRUITER');

-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('ACTIVE', 'ON_HOLD');

-- CreateEnum
CREATE TYPE "GradReq" AS ENUM ('GRADUATE', 'UNDERGRADUATE', 'ANY');

-- CreateEnum
CREATE TYPE "WorkModel" AS ENUM ('WFH', 'ON_SITE', 'HYBRID');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('SOURCED', 'CONTACTED', 'VOICE_NOTE_SENT', 'VALIDATED', 'INTERVIEW_SCHEDULED', 'INTERVIEWED', 'ACCEPTED', 'REJECTED', 'IN_TRAINING', 'COMMISSION_ELIGIBLE', 'COMMISSION_PAID');

-- CreateEnum
CREATE TYPE "ValidationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ReminderType" AS ENUM ('PRE_INTERVIEW', 'POST_INTERVIEW', 'DAY_10', 'DAY_15', 'DAY_30');

-- CreateEnum
CREATE TYPE "CommissionStatus" AS ENUM ('PENDING', 'ELIGIBLE', 'PAID');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'RECRUITER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "trialEndsAt" TIMESTAMP(3),
    "accountExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offers" (
    "id" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "status" "OfferStatus" NOT NULL DEFAULT 'ACTIVE',
    "language" TEXT NOT NULL,
    "accountType" TEXT NOT NULL,
    "graduationRequirement" "GradReq" NOT NULL DEFAULT 'ANY',
    "location" TEXT NOT NULL,
    "workModel" "WorkModel" NOT NULL DEFAULT 'ON_SITE',
    "salaryDetails" JSONB NOT NULL,
    "workingHours" TEXT NOT NULL,
    "shift" TEXT NOT NULL,
    "daysOff" TEXT NOT NULL,
    "benefits" TEXT NOT NULL,
    "interviewProcess" TEXT NOT NULL,
    "formLink" TEXT,
    "commissionAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "commissionCurrency" TEXT NOT NULL DEFAULT 'EGP',
    "commissionPeriodDays" INTEGER NOT NULL DEFAULT 30,
    "requirements" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "recruiterId" TEXT NOT NULL,
    "offerId" TEXT,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "whatsappNumber" TEXT,
    "language" TEXT NOT NULL,
    "languageLevel" TEXT,
    "graduationStatus" TEXT NOT NULL,
    "militaryStatus" TEXT,
    "location" TEXT NOT NULL,
    "previousApplications" TEXT,
    "status" "LeadStatus" NOT NULL DEFAULT 'SOURCED',
    "interviewDate" TIMESTAMP(3),
    "trainingStartDate" TIMESTAMP(3),
    "commissionEligibleDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voice_notes" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "duration" INTEGER,
    "validationStatus" "ValidationStatus" NOT NULL DEFAULT 'PENDING',
    "validatorNotes" TEXT,
    "transcription" TEXT,
    "englishLevel" TEXT,
    "accentNotes" TEXT,
    "overallScore" TEXT,
    "assessedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "voice_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "follow_up_reminders" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "recruiterId" TEXT NOT NULL,
    "type" "ReminderType" NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "follow_up_reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commissions" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "recruiterId" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "CommissionStatus" NOT NULL DEFAULT 'PENDING',
    "eligibleDate" TIMESTAMP(3),
    "paidDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "facebook_groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeprecated" BOOLEAN NOT NULL DEFAULT false,
    "deprecatedAt" TIMESTAMP(3),
    "deprecationReason" TEXT,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "facebook_groups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "leads_recruiterId_idx" ON "leads"("recruiterId");

-- CreateIndex
CREATE INDEX "leads_offerId_idx" ON "leads"("offerId");

-- CreateIndex
CREATE INDEX "leads_status_idx" ON "leads"("status");

-- CreateIndex
CREATE INDEX "leads_createdAt_idx" ON "leads"("createdAt");

-- CreateIndex
CREATE INDEX "voice_notes_leadId_idx" ON "voice_notes"("leadId");

-- CreateIndex
CREATE INDEX "follow_up_reminders_leadId_idx" ON "follow_up_reminders"("leadId");

-- CreateIndex
CREATE INDEX "follow_up_reminders_recruiterId_idx" ON "follow_up_reminders"("recruiterId");

-- CreateIndex
CREATE INDEX "follow_up_reminders_dueDate_idx" ON "follow_up_reminders"("dueDate");

-- CreateIndex
CREATE INDEX "follow_up_reminders_isCompleted_idx" ON "follow_up_reminders"("isCompleted");

-- CreateIndex
CREATE UNIQUE INDEX "commissions_leadId_key" ON "commissions"("leadId");

-- CreateIndex
CREATE INDEX "commissions_recruiterId_idx" ON "commissions"("recruiterId");

-- CreateIndex
CREATE INDEX "commissions_offerId_idx" ON "commissions"("offerId");

-- CreateIndex
CREATE INDEX "commissions_status_idx" ON "commissions"("status");

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_recruiterId_fkey" FOREIGN KEY ("recruiterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "offers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voice_notes" ADD CONSTRAINT "voice_notes_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follow_up_reminders" ADD CONSTRAINT "follow_up_reminders_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follow_up_reminders" ADD CONSTRAINT "follow_up_reminders_recruiterId_fkey" FOREIGN KEY ("recruiterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_recruiterId_fkey" FOREIGN KEY ("recruiterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "offers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
