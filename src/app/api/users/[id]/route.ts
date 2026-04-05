import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "SUPER_ADMIN") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { name, email, password, role, isActive, trialEndsAt, accountExpiresAt } =
    body as Record<string, string | boolean | undefined>;

  // Check email uniqueness if changing
  if (email && email !== existing.email) {
    const emailTaken = await prisma.user.findUnique({ where: { email: email as string } });
    if (emailTaken) {
      return Response.json({ error: "Email already in use" }, { status: 409 });
    }
  }

  try {
    const updateData: Record<string, unknown> = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) updateData.role = role === "SUPER_ADMIN" ? "SUPER_ADMIN" : "RECRUITER";
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);
    if (password) updateData.passwordHash = await bcrypt.hash(password as string, 12);
    // Allow explicitly setting to null to clear the date
    if ("trialEndsAt" in body) {
      updateData.trialEndsAt = trialEndsAt ? new Date(trialEndsAt as string) : null;
    }
    if ("accountExpiresAt" in body) {
      updateData.accountExpiresAt = accountExpiresAt
        ? new Date(accountExpiresAt as string)
        : null;
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
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
    return Response.json({ user });
  } catch (err) {
    console.error("Update user error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
