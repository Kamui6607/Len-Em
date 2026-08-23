import type { ReactNode } from "react";
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  Activity,
  Flag,
  Shield,
  ShieldCheck,
  Scissors,
  BookOpen,
  Video,
  RotateCcw,
  Hand,
} from "lucide-react";
import { DashboardShell } from "../dashboard/DashboardShell";
import type { NavItem } from "../dashboard/Sidebar";

interface AdminLayoutProps {
  children: ReactNode;
}

const navItems: NavItem[] = [
  { path: "/admin", label: "Dashboard", icon: LayoutDashboard },
  {
    label: "Management",
    icon: Package,
    highlighted: true,
    children: [
      { path: "/admin/products", label: "Products", icon: Package },
      { path: "/admin/kits", label: "Kits", icon: Package },
      { path: "/admin/diy-posts", label: "DIY Management", icon: Scissors },
    ],
  },
  {
    label: "User & Access",
    icon: Users,
    highlighted: true,
    children: [
      { path: "/admin/users", label: "Users", icon: Users },
      { path: "/admin/roles", label: "Roles", icon: ShieldCheck },
      { path: "/admin/permissions", label: "Permissions", icon: Shield },
    ],
  },
  {
    label: "Learning",
    icon: BookOpen,
    highlighted: true,
    children: [
      { path: "/admin/courses", label: "Courses", icon: BookOpen },
      { path: "/admin/lessons", label: "Lessons", icon: Video },
    ],
  },
  { path: "/admin/orders", label: "Orders", icon: ShoppingCart },
  {
    label: "Support",
    icon: Hand,
    highlighted: true,
    children: [
      { path: "/admin/refunds", label: "Refunds", icon: RotateCcw },
      { path: "/admin/support-diy", label: "Support DIY", icon: Hand },
    ],
  },
  {
    label: "Monitoring",
    icon: Flag,
    highlighted: true,
    children: [
      { path: "/admin/reports", label: "Reports", icon: Flag },
      { path: "/admin/activity", label: "Activity Logs", icon: Activity },
    ],
  },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <DashboardShell navItems={navItems} title="Admin Panel">
      {children}
    </DashboardShell>
  );
}