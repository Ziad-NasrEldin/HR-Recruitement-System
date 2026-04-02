import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { Role } from "@/generated/prisma/client";

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
