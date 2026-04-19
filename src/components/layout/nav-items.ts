import type { Role } from "@/generated/prisma/client";

export interface NavItem {
  title: string;
  href: string;
  icon: string;
  navKey: string;
  roles: Role[];
}

export const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: "LayoutDashboard",
    navKey: "dashboard",
    roles: ["SUPER_ADMIN", "RECRUITER"],
  },
  {
    title: "Leads",
    href: "/leads",
    icon: "Users",
    navKey: "leads",
    roles: ["SUPER_ADMIN", "RECRUITER"],
  },
  {
    title: "Offers",
    href: "/offers",
    icon: "Briefcase",
    navKey: "offers",
    roles: ["SUPER_ADMIN", "RECRUITER"],
  },
  {
    title: "Commissions",
    href: "/commissions",
    icon: "DollarSign",
    navKey: "commissions",
    roles: ["SUPER_ADMIN", "RECRUITER"],
  },
  {
    title: "Analytics",
    href: "/analytics",
    icon: "BarChart3",
    navKey: "analytics",
    roles: ["SUPER_ADMIN", "RECRUITER"],
  },
  {
    title: "Post Generator",
    href: "/post-generator",
    icon: "Sparkles",
    navKey: "postGenerator",
    roles: ["SUPER_ADMIN"],
  },
  {
    title: "Campaigns",
    href: "/campaigns",
    icon: "Radio",
    navKey: "campaigns",
    roles: ["SUPER_ADMIN"],
  },
  {
    title: "Facebook Groups",
    href: "/settings/facebook-groups",
    icon: "Share2",
    navKey: "facebookGroups",
    roles: ["SUPER_ADMIN"],
  },
  {
    title: "Settings",
    href: "/settings",
    icon: "Settings",
    navKey: "settings",
    roles: ["SUPER_ADMIN"],
  },
];

export function getNavItemsForRole(role: Role): NavItem[] {
  return navItems.filter((item) => item.roles.includes(role));
}
