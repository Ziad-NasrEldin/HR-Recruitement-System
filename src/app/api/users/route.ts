import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "SUPER_ADMIN") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      trialEndsAt: true,
      accountExpiresAt: true,
      createdAt: true,
      _count: { select: { leads: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ users });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "SUPER_ADMIN") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { name, email, password, role, trialEndsAt, accountExpiresAt } = body as Record<
    string,
    string | undefined
  >;

  if (!name || !email || !password) {
    return Response.json({ error: "name, email, and password are required" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return Response.json({ error: "Email already in use" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: role === "SUPER_ADMIN" ? "SUPER_ADMIN" : "RECRUITER",
        trialEndsAt: trialEndsAt ? new Date(trialEndsAt) : null,
        accountExpiresAt: accountExpiresAt ? new Date(accountExpiresAt) : null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        trialEndsAt: true,
        accountExpiresAt: true,
        createdAt: true,
      },
    });
    return Response.json({ user }, { status: 201 });
  } catch (err) {
    console.error("Create user error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
