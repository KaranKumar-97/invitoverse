import { Globe, Home, Mail, User, LayoutTemplate, type LucideIcon } from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon; external?: boolean };

export const DASHBOARD_NAV: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: Home },
  { href: "/dashboard/invitations", label: "Invitations", icon: Mail },
  { href: "/templates", label: "Templates", icon: LayoutTemplate, external: true },
  { href: "/dashboard/account", label: "Account", icon: User },
  { href: "/", label: "Home page", icon: Globe, external: true },
];
