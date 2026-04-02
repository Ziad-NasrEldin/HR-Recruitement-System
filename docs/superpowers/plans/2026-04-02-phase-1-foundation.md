# Phase 1: Foundation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the Next.js 15 project with database schema, authentication, and layout shell — the foundation everything else builds on.

**Architecture:** Monolithic Next.js 15 App Router with PostgreSQL (Prisma), NextAuth.js v5 credentials auth, and shadcn/ui. Two roles: SUPER_ADMIN (Ziad) and RECRUITER. JWT sessions, role guards at page level.

**Tech Stack:** Next.js 15, TypeScript, PostgreSQL, Prisma, NextAuth.js v5, Tailwind CSS, shadcn/ui, bcryptjs, lucide-react

---

## File Inventory

| File | Action | Task |
|------|--------|------|
| `prisma/schema.prisma` | Create | 2 |
| `prisma/seed.ts` | Create | 4 |
| `src/lib/prisma.ts` | Create | 2 |
| `src/lib/auth.ts` | Create | 3 |
| `src/lib/auth-utils.ts` | Create | 5 |
| `src/types/index.ts` | Create | 2 |
| `src/app/layout.tsx` | Modify | 6 |
| `src/app/page.tsx` | Modify | 6 |
| `src/app/api/auth/[...nextauth]/route.ts` | Create | 3 |
| `src/app/(auth)/layout.tsx` | Create | 3 |
| `src/app/(auth)/login/page.tsx` | Create | 3 |
| `src/app/(auth)/login/login-form.tsx` | Create | 3 |
| `src/app/(dashboard)/layout.tsx` | Create | 6 |
| `src/app/(dashboard)/dashboard/page.tsx` | Create | 7 |
| `src/app/(dashboard)/leads/page.tsx` | Create | 7 |
| `src/app/(dashboard)/offers/page.tsx` | Create | 7 |
| `src/app/(dashboard)/commissions/page.tsx` | Create | 7 |
| `src/app/(dashboard)/analytics/page.tsx` | Create | 7 |
| `src/app/(dashboard)/settings/page.tsx` | Create | 7 |
| `src/components/layout/nav-items.ts` | Create | 6 |
| `src/components/layout/sidebar.tsx` | Create | 6 |
| `src/components/layout/mobile-sidebar.tsx` | Create | 6 |
| `src/components/layout/header.tsx` | Create | 6 |
| `middleware.ts` | Create | 5 |
| `.env.example` | Create | 1 |

---

### Task 1: Project Scaffolding

**Files:**
- Generated: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`, `components.json`, `.gitignore`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `src/lib/utils.ts`, `src/components/ui/*`
- Create: `.env.example`, `.env`

- [ ] **Step 1: Initialize git**

```bash
cd "E:/GitHub/HR Recruitement System"
git init
```

- [ ] **Step 2: Create Next.js 15 app**

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --turbopack --use-npm
```

If prompted about the existing `docs` folder, answer yes to proceed.

- [ ] **Step 3: Install core dependencies**

```bash
npm install prisma @prisma/client next-auth@beta bcryptjs
npm install -D @types/bcryptjs tsx
```

- [ ] **Step 4: Initialize Prisma**

```bash
npx prisma init --datasource-provider postgresql
```

- [ ] **Step 5: Initialize shadcn/ui**

```bash
npx shadcn@latest init -d
```

- [ ] **Step 6: Install shadcn components**

```bash
npx shadcn@latest add button card input label separator avatar dropdown-menu sheet badge
```

- [ ] **Step 7: Create `.env.example`**

Create `E:/GitHub/HR Recruitement System/.env.example`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/hr_recruitment?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-a-secret-with-openssl-rand-base64-32"

# Super Admin Seed
SUPER_ADMIN_EMAIL="ziad@example.com"
SUPER_ADMIN_PASSWORD="change-this-password"
SUPER_ADMIN_NAME="Ziad"
```

- [ ] **Step 8: Update `.env` with dev values**

Same structure as `.env.example` with real values. Generate NEXTAUTH_SECRET:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

- [ ] **Step 9: Ensure `.gitignore` includes**

```
.env
.env.local
uploads/
```

- [ ] **Step 10: Install lucide-react**

```bash
npm install lucide-react
```

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js 15 project with Prisma, NextAuth, and shadcn/ui"
```

---

### Task 2: Prisma Database Schema

**Files:**
- Create: `prisma/schema.prisma`
- Create: `src/lib/prisma.ts`
- Create: `src/types/index.ts`

- [ ] **Step 1: Write the Prisma schema**

Replace `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── Enums ───────────────────────────────────────────────

enum Role {
  SUPER_ADMIN
  RECRUITER
}

enum OfferStatus {
  ACTIVE
  ON_HOLD
}

enum GradReq {
  GRADUATE
  UNDERGRADUATE
  ANY
}

enum WorkModel {
  WFH
  ON_SITE
  HYBRID
}

enum LeadStatus {
  SOURCED
  CONTACTED
  VOICE_NOTE_SENT
  VALIDATED
  INTERVIEW_SCHEDULED
  INTERVIEWED
  ACCEPTED
  REJECTED
  IN_TRAINING
  COMMISSION_ELIGIBLE
  COMMISSION_PAID
}

enum ValidationStatus {
  PENDING
  APPROVED
  REJECTED
}

enum ReminderType {
  PRE_INTERVIEW
  POST_INTERVIEW
  DAY_10
  DAY_15
  DAY_30
}

enum CommissionStatus {
  PENDING
  ELIGIBLE
  PAID
}

// ─── Models ──────────────────────────────────────────────

model User {
  id               String    @id @default(cuid())
  email            String    @unique
  name             String
  passwordHash     String
  role             Role      @default(RECRUITER)
  isActive         Boolean   @default(true)
  trialEndsAt      DateTime?
  accountExpiresAt DateTime?
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt

  leads             Lead[]
  commissions       Commission[]
  followUpReminders FollowUpReminder[]

  @@map("users")
}

model Offer {
  id                    String      @id @default(cuid())
  company               String
  status                OfferStatus @default(ACTIVE)
  language              String
  accountType           String
  graduationRequirement GradReq     @default(ANY)
  location              String
  workModel             WorkModel   @default(ON_SITE)
  salaryDetails         Json
  workingHours          String
  shift                 String
  daysOff               String
  benefits              String
  interviewProcess      String
  formLink              String?
  commissionAmount      Float
  commissionPeriodDays  Int
  requirements          String?
  createdAt             DateTime    @default(now())
  updatedAt             DateTime    @updatedAt

  leads       Lead[]
  commissions Commission[]

  @@map("offers")
}

model Lead {
  id                     String     @id @default(cuid())
  recruiterId            String
  offerId                String?
  name                   String
  phone                  String
  email                  String?
  whatsappNumber         String?
  language               String
  languageLevel          String?
  graduationStatus       String
  militaryStatus         String?
  location               String
  previousApplications  String?
  status                 LeadStatus @default(SOURCED)
  interviewDate          DateTime?
  trainingStartDate      DateTime?
  commissionEligibleDate DateTime?
  notes                  String?
  createdAt              DateTime   @default(now())
  updatedAt              DateTime   @updatedAt

  recruiter         User              @relation(fields: [recruiterId], references: [id])
  offer             Offer?            @relation(fields: [offerId], references: [id])
  voiceNotes        VoiceNote[]
  followUpReminders FollowUpReminder[]
  commission        Commission?

  @@index([recruiterId])
  @@index([offerId])
  @@index([status])
  @@index([createdAt])
  @@map("leads")
}

model VoiceNote {
  id               String           @id @default(cuid())
  leadId           String
  fileUrl          String
  language         String
  duration         Int?
  validationStatus ValidationStatus @default(PENDING)
  validatorNotes   String?
  createdAt        DateTime         @default(now())

  lead Lead @relation(fields: [leadId], references: [id], onDelete: Cascade)

  @@index([leadId])
  @@map("voice_notes")
}

model FollowUpReminder {
  id          String       @id @default(cuid())
  leadId      String
  recruiterId String
  type        ReminderType
  dueDate     DateTime
  isCompleted Boolean      @default(false)
  completedAt DateTime?
  createdAt   DateTime     @default(now())

  lead      Lead @relation(fields: [leadId], references: [id], onDelete: Cascade)
  recruiter User @relation(fields: [recruiterId], references: [id])

  @@index([leadId])
  @@index([recruiterId])
  @@index([dueDate])
  @@index([isCompleted])
  @@map("follow_up_reminders")
}

model Commission {
  id           String           @id @default(cuid())
  leadId       String           @unique
  recruiterId  String
  offerId      String
  amount       Float
  status       CommissionStatus @default(PENDING)
  eligibleDate DateTime?
  paidDate     DateTime?
  createdAt    DateTime         @default(now())
  updatedAt    DateTime         @updatedAt

  lead      Lead  @relation(fields: [leadId], references: [id], onDelete: Cascade)
  recruiter User  @relation(fields: [recruiterId], references: [id])
  offer     Offer @relation(fields: [offerId], references: [id])

  @@index([recruiterId])
  @@index([offerId])
  @@index([status])
  @@map("commissions")
}
```

- [ ] **Step 2: Generate Prisma client**

```bash
npx prisma generate
```

- [ ] **Step 3: Create Prisma singleton**

Create `src/lib/prisma.ts`:

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

- [ ] **Step 4: Create shared types**

Create `src/types/index.ts`:

```typescript
import type {
  Role,
  OfferStatus,
  GradReq,
  WorkModel,
  LeadStatus,
  ValidationStatus,
  ReminderType,
  CommissionStatus,
} from "@prisma/client";

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
```

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma src/lib/prisma.ts src/types/index.ts
git commit -m "feat: define complete Prisma schema with all entities, enums, and indexes"
```

---

### Task 3: Authentication (NextAuth.js v5)

**Files:**
- Create: `src/lib/auth.ts`
- Create: `src/app/api/auth/[...nextauth]/route.ts`
- Create: `src/app/(auth)/layout.tsx`
- Create: `src/app/(auth)/login/page.tsx`
- Create: `src/app/(auth)/login/login-form.tsx`

- [ ] **Step 1: Create NextAuth configuration**

Create `src/lib/auth.ts`:

```typescript
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          return null;
        }

        if (!user.isActive) {
          throw new Error("Account is deactivated. Contact your administrator.");
        }

        if (user.accountExpiresAt && new Date() > user.accountExpiresAt) {
          throw new Error("Account has expired. Contact your administrator.");
        }

        if (
          user.role === "RECRUITER" &&
          user.trialEndsAt &&
          new Date() > user.trialEndsAt
        ) {
          throw new Error("Trial period has ended. Contact your administrator.");
        }

        const passwordMatch = await bcrypt.compare(password, user.passwordHash);

        if (!passwordMatch) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isActive: user.isActive,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
        token.isActive = user.isActive;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.isActive = token.isActive;
      }
      return session;
    },
    async authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const isOnLoginPage = request.nextUrl.pathname.startsWith("/login");

      if (isOnLoginPage) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/dashboard", request.nextUrl));
        }
        return true;
      }

      return isLoggedIn;
    },
  },
});
```

- [ ] **Step 2: Create API route handler**

Create `src/app/api/auth/[...nextauth]/route.ts`:

```typescript
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
```

- [ ] **Step 3: Create auth layout**

Create `src/app/(auth)/layout.tsx`:

```tsx
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
```

- [ ] **Step 4: Create login page**

Create `src/app/(auth)/login/page.tsx`:

```tsx
import { LoginForm } from "./login-form";

export const metadata = {
  title: "Login | HR Recruitment System",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight">
            HR Recruitment System
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to your account to continue
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create login form (client component)**

Create `src/app/(auth)/login/login-form.tsx`:

```tsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(
          result.error === "CredentialsSignin"
            ? "Invalid email or password."
            : result.error
        );
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <form onSubmit={onSubmit}>
        <CardContent className="space-y-4 pt-6">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              autoComplete="email"
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              disabled={isLoading}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign in"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/auth.ts src/app/api/auth/ src/app/(auth)/ src/types/index.ts
git commit -m "feat: implement NextAuth.js credentials authentication with login page"
```

---

### Task 4: Super Admin Seed Script

**Files:**
- Create: `prisma/seed.ts`
- Modify: `package.json` (add prisma.seed config)

- [ ] **Step 1: Create seed script**

Create `prisma/seed.ts`:

```typescript
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SUPER_ADMIN_EMAIL || "ziad@hrrecruit.com";
  const password = process.env.SUPER_ADMIN_PASSWORD || "admin123456";
  const name = process.env.SUPER_ADMIN_NAME || "Ziad";

  console.log(`Seeding super admin: ${email}`);

  const existingAdmin = await prisma.user.findUnique({
    where: { email },
  });

  if (existingAdmin) {
    console.log("Super admin already exists. Skipping.");
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      role: "SUPER_ADMIN",
      isActive: true,
    },
  });

  console.log(`Super admin created: ${admin.id} (${admin.email})`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

- [ ] **Step 2: Add prisma seed config to package.json**

Add this to the top-level `package.json` (not inside `scripts`):

```json
"prisma": {
  "seed": "npx tsx prisma/seed.ts"
}
```

- [ ] **Step 3: Commit**

```bash
git add prisma/seed.ts package.json
git commit -m "feat: add super admin seed script with idempotent creation"
```

---

### Task 5: Auth Middleware & Role Guards

**Files:**
- Create: `middleware.ts` (project root)
- Create: `src/lib/auth-utils.ts`

- [ ] **Step 1: Create middleware**

Create `middleware.ts` at project root:

```typescript
export { auth as middleware } from "@/lib/auth";

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth).*)",
  ],
};
```

- [ ] **Step 2: Create role guard utilities**

Create `src/lib/auth-utils.ts`:

```typescript
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return session;
}

export async function requireRole(role: Role) {
  const session = await requireAuth();
  if (session.user.role !== role) {
    redirect("/dashboard");
  }
  return session;
}

export async function requireSuperAdmin() {
  return requireRole("SUPER_ADMIN");
}

export async function hasRole(role: Role): Promise<boolean> {
  const session = await auth();
  return session?.user?.role === role;
}
```

- [ ] **Step 3: Commit**

```bash
git add middleware.ts src/lib/auth-utils.ts
git commit -m "feat: add auth middleware and role-based access control utilities"
```

---

### Task 6: Layout Shell (Sidebar + Header)

**Files:**
- Create: `src/components/layout/nav-items.ts`
- Create: `src/components/layout/sidebar.tsx`
- Create: `src/components/layout/mobile-sidebar.tsx`
- Create: `src/components/layout/header.tsx`
- Create: `src/app/(dashboard)/layout.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Define navigation items**

Create `src/components/layout/nav-items.ts`:

```typescript
import type { Role } from "@prisma/client";

export interface NavItem {
  title: string;
  href: string;
  icon: string;
  roles: Role[];
}

export const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: "LayoutDashboard",
    roles: ["SUPER_ADMIN", "RECRUITER"],
  },
  {
    title: "Leads",
    href: "/leads",
    icon: "Users",
    roles: ["SUPER_ADMIN", "RECRUITER"],
  },
  {
    title: "Offers",
    href: "/offers",
    icon: "Briefcase",
    roles: ["SUPER_ADMIN", "RECRUITER"],
  },
  {
    title: "Commissions",
    href: "/commissions",
    icon: "DollarSign",
    roles: ["SUPER_ADMIN", "RECRUITER"],
  },
  {
    title: "Analytics",
    href: "/analytics",
    icon: "BarChart3",
    roles: ["SUPER_ADMIN", "RECRUITER"],
  },
  {
    title: "Settings",
    href: "/settings",
    icon: "Settings",
    roles: ["SUPER_ADMIN"],
  },
];

export function getNavItemsForRole(role: Role): NavItem[] {
  return navItems.filter((item) => item.roles.includes(role));
}
```

- [ ] **Step 2: Create sidebar component**

Create `src/components/layout/sidebar.tsx`:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  DollarSign,
  BarChart3,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getNavItemsForRole } from "./nav-items";
import type { Role } from "@prisma/client";

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  Users,
  Briefcase,
  DollarSign,
  BarChart3,
  Settings,
};

interface SidebarProps {
  role: Role;
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const items = getNavItemsForRole(role);

  return (
    <aside className="hidden w-64 shrink-0 border-r bg-background md:block">
      <div className="flex h-14 items-center border-b px-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <Briefcase className="h-5 w-5" />
          <span>HR Recruit</span>
        </Link>
      </div>
      <nav className="flex flex-col gap-1 p-4">
        {items.map((item) => {
          const Icon = iconMap[item.icon];
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {Icon && <Icon className="h-4 w-4" />}
              {item.title}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
```

- [ ] **Step 3: Create mobile sidebar**

Create `src/components/layout/mobile-sidebar.tsx`:

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  Briefcase,
  LayoutDashboard,
  Users,
  DollarSign,
  BarChart3,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { getNavItemsForRole } from "./nav-items";
import type { Role } from "@prisma/client";

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  Users,
  Briefcase,
  DollarSign,
  BarChart3,
  Settings,
};

interface MobileSidebarProps {
  role: Role;
}

export function MobileSidebar({ role }: MobileSidebarProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const items = getNavItemsForRole(role);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <div className="flex h-14 items-center border-b px-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-semibold"
            onClick={() => setOpen(false)}
          >
            <Briefcase className="h-5 w-5" />
            <span>HR Recruit</span>
          </Link>
        </div>
        <nav className="flex flex-col gap-1 p-4">
          {items.map((item) => {
            const Icon = iconMap[item.icon];
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {Icon && <Icon className="h-4 w-4" />}
                {item.title}
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
```

- [ ] **Step 4: Create header component**

Create `src/components/layout/header.tsx`:

```tsx
import { auth, signOut } from "@/lib/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { MobileSidebar } from "./mobile-sidebar";
import { LogOut } from "lucide-react";
import { ROLE_LABELS } from "@/types";

export async function Header() {
  const session = await auth();
  if (!session?.user) return null;

  const initials = session.user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6">
      <MobileSidebar role={session.user.role} />
      <div className="flex-1" />
      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {session.user.name}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {session.user.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-default" disabled>
              <Badge variant="secondary" className="text-xs">
                {ROLE_LABELS[session.user.role]}
              </Badge>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <DropdownMenuItem asChild>
                <button type="submit" className="w-full cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </button>
              </DropdownMenuItem>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
```

- [ ] **Step 5: Create dashboard layout**

Create `src/app/(dashboard)/layout.tsx`:

```tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar role={session.user.role} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Update root layout**

Replace `src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HR Recruitment System",
  description: "HR Recruitment CRM for managing candidates and commissions",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
```

- [ ] **Step 7: Update root page to redirect**

Replace `src/app/page.tsx`:

```tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function RootPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
}
```

- [ ] **Step 8: Commit**

```bash
git add src/components/layout/ src/app/(dashboard)/layout.tsx src/app/page.tsx src/app/layout.tsx
git commit -m "feat: build authenticated layout shell with sidebar, header, and role-based navigation"
```

---

### Task 7: Dashboard & Section Placeholders

**Files:**
- Create: `src/app/(dashboard)/dashboard/page.tsx`
- Create: `src/app/(dashboard)/leads/page.tsx`
- Create: `src/app/(dashboard)/offers/page.tsx`
- Create: `src/app/(dashboard)/commissions/page.tsx`
- Create: `src/app/(dashboard)/analytics/page.tsx`
- Create: `src/app/(dashboard)/settings/page.tsx`

- [ ] **Step 1: Create dashboard page**

Create `src/app/(dashboard)/dashboard/page.tsx`:

```tsx
import { auth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Briefcase, DollarSign, TrendingUp } from "lucide-react";

export const metadata = {
  title: "Dashboard | HR Recruitment System",
};

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {session?.user?.name}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">Coming in Phase 3</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Offers</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">Coming in Phase 2</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Commissions</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">Coming in Phase 5</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">Coming in Phase 7</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Activity feed will be populated in upcoming phases.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Create leads placeholder**

Create `src/app/(dashboard)/leads/page.tsx`:

```tsx
export const metadata = { title: "Leads | HR Recruitment System" };

export default function LeadsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Leads</h1>
      <p className="text-muted-foreground">Lead management will be built in Phase 3.</p>
    </div>
  );
}
```

- [ ] **Step 3: Create offers placeholder**

Create `src/app/(dashboard)/offers/page.tsx`:

```tsx
export const metadata = { title: "Offers | HR Recruitment System" };

export default function OffersPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Offers</h1>
      <p className="text-muted-foreground">Offer management will be built in Phase 2.</p>
    </div>
  );
}
```

- [ ] **Step 4: Create commissions placeholder**

Create `src/app/(dashboard)/commissions/page.tsx`:

```tsx
export const metadata = { title: "Commissions | HR Recruitment System" };

export default function CommissionsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Commissions</h1>
      <p className="text-muted-foreground">Commission tracking will be built in Phase 5.</p>
    </div>
  );
}
```

- [ ] **Step 5: Create analytics placeholder**

Create `src/app/(dashboard)/analytics/page.tsx`:

```tsx
export const metadata = { title: "Analytics | HR Recruitment System" };

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
      <p className="text-muted-foreground">Performance analytics will be built in Phase 7.</p>
    </div>
  );
}
```

- [ ] **Step 6: Create settings placeholder (super admin only)**

Create `src/app/(dashboard)/settings/page.tsx`:

```tsx
import { requireSuperAdmin } from "@/lib/auth-utils";

export const metadata = { title: "Settings | HR Recruitment System" };

export default async function SettingsPage() {
  await requireSuperAdmin();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
      <p className="text-muted-foreground">User management and system settings will be built in Phase 6.</p>
    </div>
  );
}
```

- [ ] **Step 7: Commit**

```bash
git add src/app/(dashboard)/
git commit -m "feat: add dashboard and section placeholder pages with role-guarded settings"
```

---

## Verification

After all tasks are complete:

```bash
# 1. Ensure PostgreSQL is running and DATABASE_URL is set in .env
# 2. Run the migration
npx prisma migrate dev --name init

# 3. Seed the super admin
npx prisma db seed

# 4. Start the dev server
npm run dev

# 5. Manual tests:
# - Visit http://localhost:3000 → redirects to /login
# - Wrong credentials → shows error message
# - Super admin credentials → redirects to /dashboard
# - Dashboard shows 4 placeholder cards
# - Sidebar shows all 6 nav items (Dashboard, Leads, Offers, Commissions, Analytics, Settings)
# - Click each nav item → placeholder page renders
# - User avatar dropdown shows name, email, "Super Admin" badge
# - Sign out → returns to /login
# - Visit /dashboard while logged out → redirects to /login
# - Create a test recruiter via Prisma Studio (npx prisma studio)
# - Login as recruiter → Settings not in sidebar
# - Navigate to /settings manually → redirects to /dashboard
```
