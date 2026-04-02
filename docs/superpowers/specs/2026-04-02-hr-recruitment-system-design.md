# HR Recruitment System — Design Specification

## Context

Egyptian HR recruitment agencies source candidates (primarily through Facebook/LinkedIn groups), screen them via voice notes and language assessments, schedule interviews with hiring companies, and follow up through training and retention periods to earn commissions. This process is currently manual — tracked via spreadsheets and personal messaging. This system digitizes the entire workflow into a centralized CRM with future AI and messaging integrations.

**Owner:** Ziad (Super Admin)
**Users:** 10-50 HR recruiters
**Date:** 2026-04-02

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | NextAuth.js (Credentials provider) |
| UI | Tailwind CSS + shadcn/ui |
| Background Jobs | BullMQ + Redis (for reminders/scheduling) |
| File Storage | Local disk or S3-compatible (for voice notes) |
| Deployment | Self-hosted VPS |

---

## Roles & Access Control

Two roles only:

- **SUPER_ADMIN** — Single account (Ziad). Full system access: manages recruiter accounts, imports/edits offers, views all data, configures system.
- **RECRUITER** — Manages own leads only. Views offers (read-only). Sees own performance metrics.

No self-registration. Super admin creates all recruiter accounts with optional trial period and expiry date. Expired/deactivated accounts are blocked at login.

### Permission Matrix

| Action | Super Admin | Recruiter |
|--------|------------|-----------|
| Manage recruiter accounts | Yes | No |
| Import/edit offers | Yes | No |
| View all leads across recruiters | Yes | No |
| Create/manage own leads | Yes | Yes |
| View offer catalog | Yes | Yes (read-only) |
| View all performance dashboards | Yes | Own only |
| System settings | Yes | No |

---

## Data Model

### User
```
id              String    @id @default(cuid())
email           String    @unique
name            String
passwordHash    String
role            Role      (SUPER_ADMIN | RECRUITER)
isActive        Boolean   @default(true)
trialEndsAt     DateTime?
accountExpiresAt DateTime?
createdAt       DateTime  @default(now())
updatedAt       DateTime  @updatedAt
leads           Lead[]
commissions     Commission[]
```

### Offer
```
id                    String   @id @default(cuid())
company               String
status                OfferStatus (ACTIVE | ON_HOLD)
language              String
accountType           String   // Sales, CS, Telesales, Tech Support, etc.
graduationRequirement GradReq  (GRADUATE | UNDERGRADUATE | ANY)
location              String
workModel             WorkModel (WFH | ON_SITE | HYBRID)
salaryDetails         Json     // { base, commission, bonuses }
workingHours          String
shift                 String   // fixed, rotational, overnight
daysOff               String
benefits              String
interviewProcess      String
formLink              String?
commissionAmount      Float    // recruiter commission in EGP
commissionPeriodDays  Int      // 15, 30, 40, 45 etc.
requirements          String?  // age limits, experience, etc.
createdAt             DateTime @default(now())
updatedAt             DateTime @updatedAt
leads                 Lead[]
```

### Lead
```
id                   String      @id @default(cuid())
recruiterId          String      // FK → User
offerId              String?     // FK → Offer
name                 String
phone                String
email                String?
whatsappNumber       String?
language             String
languageLevel        String?     // B2+, C1, etc.
graduationStatus     String      // graduate, undergraduate, dropout
militaryStatus       String?     // completed, exempted, postponed (males)
location             String
previousApplications String?     // notes on prior applications
status               LeadStatus  // pipeline enum (see below)
interviewDate        DateTime?
trainingStartDate    DateTime?
commissionEligibleDate DateTime?
notes                String?
createdAt            DateTime    @default(now())
updatedAt            DateTime    @updatedAt
recruiter            User        @relation
offer                Offer?      @relation
voiceNotes           VoiceNote[]
followUpReminders    FollowUpReminder[]
commission           Commission?
```

**LeadStatus enum:**
`SOURCED → CONTACTED → VOICE_NOTE_SENT → VALIDATED → INTERVIEW_SCHEDULED → INTERVIEWED → ACCEPTED → REJECTED → IN_TRAINING → COMMISSION_ELIGIBLE → COMMISSION_PAID`

### VoiceNote
```
id               String           @id @default(cuid())
leadId           String           // FK → Lead
fileUrl          String
language         String
duration         Int?             // seconds
validationStatus ValidationStatus (PENDING | APPROVED | REJECTED)
validatorNotes   String?
createdAt        DateTime         @default(now())
```

### FollowUpReminder
```
id          String       @id @default(cuid())
leadId      String       // FK → Lead
recruiterId String       // FK → User
type        ReminderType (PRE_INTERVIEW | POST_INTERVIEW | DAY_10 | DAY_15 | DAY_30)
dueDate     DateTime
isCompleted Boolean      @default(false)
completedAt DateTime?
createdAt   DateTime     @default(now())
```

### Commission
```
id           String           @id @default(cuid())
leadId       String           @unique // FK → Lead
recruiterId  String           // FK → User
offerId      String           // FK → Offer
amount       Float
status       CommissionStatus (PENDING | ELIGIBLE | PAID)
eligibleDate DateTime?
paidDate     DateTime?
createdAt    DateTime         @default(now())
updatedAt    DateTime         @updatedAt
```

---

## Module Design

### Module 1: Core CRM (Build First)

#### 1.1 Dashboard (`/dashboard`)
- Pipeline funnel: count of leads at each status stage
- Upcoming follow-up reminders (next 7 days)
- Recent lead activity feed
- Quick stats: total leads, conversion rate, pending commissions
- Super admin sees aggregate across all recruiters; recruiter sees own data

#### 1.2 Lead Management (`/leads`, `/leads/[id]`, `/leads/new`)
- **List view**: Sortable/filterable table (by status, offer, language, date range, recruiter)
- **Kanban view**: Drag-and-drop pipeline board grouped by LeadStatus
- **Lead detail**: Full profile with editable fields, status timeline, voice notes section, follow-up history, commission status
- **Create lead**: Form with all candidate fields, offer assignment dropdown
- Auto-generate follow-up reminders when status changes:
  - → INTERVIEW_SCHEDULED: creates PRE_INTERVIEW reminder (day before)
  - → INTERVIEWED: creates POST_INTERVIEW reminder (next day)
  - → ACCEPTED/IN_TRAINING: creates DAY_10, DAY_15, DAY_30 reminders based on trainingStartDate

#### 1.3 Offer Management (`/offers`, `/offers/import`, `/offers/[id]`)
- **Catalog view**: Grid/list with filters (language, location, status, company)
- **Excel import**: Upload .xlsx, map columns, preview, and import
- **CRUD**: Super admin can create/edit/delete offers
- **Offer detail**: Full info display, link to leads using this offer

#### 1.4 Follow-Up System
- **Notification center**: Bell icon with count of due/overdue reminders
- **Reminder list**: Filterable by type, date, completion status
- **Background job**: BullMQ worker checks daily for due reminders, marks them as actionable
- Recruiters can mark reminders as completed with optional notes

#### 1.5 Commission Tracking (`/commissions`)
- Table of all commissions with status filters
- Auto-created when lead reaches COMMISSION_ELIGIBLE status
- Amount auto-populated from the linked offer's commissionAmount
- Super admin can mark as PAID
- Summary: total earned, total pending, total paid

#### 1.6 User Management (`/settings/users`) — Super Admin Only
- List of all recruiter accounts with status
- Create new recruiter (name, email, password, trial period, expiry)
- Activate/deactivate accounts
- Edit trial/expiry dates

#### 1.7 Recruiter Performance (`/analytics`)
- Leads generated (by time period)
- Conversion funnel (sourced → commission eligible %)
- Commission totals
- Super admin: comparative view across all recruiters
- Recruiter: own metrics only

---

### Module 2: WhatsApp Integration (Future)

**Architecture:** Provider adapter pattern

```
interface WhatsAppProvider {
  sendMessage(to: string, body: string): Promise<MessageResult>
  sendTemplate(to: string, templateId: string, params: Record<string, string>): Promise<MessageResult>
  onMessageReceived(handler: (msg: IncomingMessage) => void): void
}
```

- Adapter implementations for WhatsApp Business API, Twilio, WATI, etc.
- Message history stored per lead in a `Message` table
- Template messages for common follow-ups (interview reminder, congrats, check-in)
- Quick-send from lead detail page
- Webhook endpoint for incoming messages

### Module 3: AI Voice Assessment (Future)

**Architecture:** Provider adapter pattern

```
interface VoiceAssessmentProvider {
  transcribe(audioUrl: string): Promise<Transcription>
  assessLanguageLevel(transcription: string, targetLanguage: string): Promise<LanguageAssessment>
}
```

- Upload voice note → auto-transcribe → AI language level assessment
- Results: detected language, fluency score, estimated CEFR level, notes
- Stored in VoiceNote record with assessment JSON
- Team leader can override AI assessment

### Module 4: AI Post Generator (Future)

**Architecture:** Provider adapter pattern

```
interface PostGeneratorProvider {
  generatePost(offer: Offer, style: PostStyle, platform: Platform): Promise<GeneratedPost>
}
```

- Input: offer details + style preference + target platform
- Styles: professional, casual, meme/trend-based, benefit-focused
- Platform formatting: Facebook (with engagement hooks), LinkedIn (professional tone)
- Follows posting guidelines: no company name, call-to-action, mystery element
- History of generated posts saved for reuse

### Module 5: AI Post Publisher (Future)

- Scheduled posting to Facebook groups
- Group cooldown tracking (max 15 posts/hour across groups)
- Optimal timing suggestions (Thursday/Friday/Saturday nights)
- Post status tracking (posted, pending, failed)
- Integration with Facebook Graph API for group posting
- Dashboard showing post reach and engagement metrics

---

## Project Structure

```
/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/
│   │   │   ├── leads/
│   │   │   ├── offers/
│   │   │   ├── commissions/
│   │   │   ├── analytics/
│   │   │   └── settings/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   ├── leads/
│   │   │   ├── offers/
│   │   │   ├── commissions/
│   │   │   ├── reminders/
│   │   │   ├── users/
│   │   │   └── upload/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/          (shadcn components)
│   │   ├── layout/      (sidebar, header, etc.)
│   │   ├── leads/       (lead-specific components)
│   │   ├── offers/      (offer-specific components)
│   │   └── dashboard/   (dashboard widgets)
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── auth.ts
│   │   ├── utils.ts
│   │   └── constants.ts
│   ├── services/
│   │   ├── leads.ts
│   │   ├── offers.ts
│   │   ├── commissions.ts
│   │   ├── reminders.ts
│   │   └── users.ts
│   ├── providers/       (future: adapter interfaces)
│   │   ├── whatsapp/
│   │   ├── voice-assessment/
│   │   ├── post-generator/
│   │   └── post-publisher/
│   └── types/
│       └── index.ts
├── workers/
│   └── reminder-worker.ts
├── public/
├── uploads/             (voice notes, imported files)
├── .env
├── package.json
├── tsconfig.json
└── next.config.ts
```

---

## Build Order

1. **Phase 1 — Foundation**: Project setup, database schema, auth, layout shell
2. **Phase 2 — Offers**: Import from Excel, offer CRUD, catalog UI
3. **Phase 3 — Leads**: Lead CRUD, pipeline views (table + kanban), lead detail
4. **Phase 4 — Follow-ups**: Reminder auto-generation, notification center, background worker
5. **Phase 5 — Commissions**: Commission tracking, auto-creation, payment marking
6. **Phase 6 — User Management**: Recruiter account CRUD, trial/expiry logic
7. **Phase 7 — Analytics**: Performance dashboards, metrics
8. **Phase 8 — WhatsApp Integration** (future)
9. **Phase 9 — AI Voice Assessment** (future)
10. **Phase 10 — AI Post Generator** (future)
11. **Phase 11 — AI Post Publisher** (future)

---

## Verification Plan

- **Auth**: Login as super admin, create recruiter, login as recruiter, verify permission boundaries
- **Offers**: Import Excel file, verify data mapping, edit an offer, check recruiter sees read-only
- **Leads**: Create lead, move through pipeline, verify reminders auto-generate at correct stages
- **Follow-ups**: Check reminders appear on dashboard, mark complete, verify background worker triggers
- **Commissions**: Move lead to COMMISSION_ELIGIBLE, verify commission auto-created with correct amount
- **User Management**: Create/deactivate recruiter, verify expired accounts can't login
- **Analytics**: Verify metrics match actual lead/commission data
