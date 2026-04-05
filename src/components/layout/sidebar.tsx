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
  Sparkles,
  Share2,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getNavItemsForRole } from "./nav-items";
import type { Role } from "@/generated/prisma/client";

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  Users,
  Briefcase,
  DollarSign,
  BarChart3,
  Settings,
  Sparkles,
  Share2,
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
            (item.href !== "/dashboard" &&
              item.href !== "/settings" &&
              pathname.startsWith(item.href)) ||
            (item.href === "/settings" && pathname === "/settings");

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
