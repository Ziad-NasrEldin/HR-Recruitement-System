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
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
      {/* base-nova: SheetTrigger uses @base-ui/react/dialog Trigger which supports render prop */}
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon" className="md:hidden" />
        }
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle menu</span>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        {/* SheetTitle required for accessibility with @base-ui/react dialog */}
        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
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
