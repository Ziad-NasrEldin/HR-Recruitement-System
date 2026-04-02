import type { Role } from "@/generated/prisma/client";

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
