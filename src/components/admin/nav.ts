import {
  BarChart3,
  Globe,
  Image,
  LayoutDashboard,
  LayoutTemplate,
  Music,
  ScrollText,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { PermissionKey } from "@/lib/admin/permissions";

/** Admin sidebar (docs/19-admin-panel.md §3). `need` decides who sees the link. */
export const ADMIN_NAV: ReadonlyArray<{
  href: string;
  label: string;
  icon: LucideIcon;
  need: PermissionKey | "superadmin" | null;
}> = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, need: null },
  { href: "/admin/templates", label: "Templates", icon: LayoutTemplate, need: "templates.view" },
  { href: "/admin/users", label: "Users", icon: Users, need: "users.view" },
  { href: "/admin/sites", label: "Deployed sites", icon: Globe, need: "sites.view" },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3, need: "analytics.view" },
  { href: "/admin/assets/music", label: "Music", icon: Music, need: "assets.view" },
  { href: "/admin/assets/templates", label: "Template art", icon: Image, need: "assets.view" },
  { href: "/admin/admins", label: "Admins", icon: ShieldCheck, need: "superadmin" },
  { href: "/admin/audit", label: "Audit log", icon: ScrollText, need: "audit.view" },
];
