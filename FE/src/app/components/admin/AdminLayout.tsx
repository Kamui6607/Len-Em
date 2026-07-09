import type { ReactNode } from "react";
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  Activity,
  Flag,
  Shield,
  ShieldCheck,
  Scissors,
} from "lucide-react";
import { DashboardShell } from "../dashboard/DashboardShell";
import type { NavItem } from "../dashboard/Sidebar";

interface AdminLayoutProps {
  children: ReactNode;
}

const navItems: NavItem[] = [
  { path: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { path: "/admin/users", label: "Users", icon: Users },
  { path: "/admin/products", label: "Products", icon: Package },
  { path: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { path: "/admin/diy-posts", label: "DIY Management", icon: Scissors },
  { path: "/admin/reports", label: "Report Management", icon: Flag },
  { path: "/admin/payments", label: "Payments", icon: DollarSign },
  { path: "/admin/roles", label: "Roles", icon: ShieldCheck },
  { path: "/admin/permissions", label: "Permissions", icon: Shield },
  { path: "/admin/activity", label: "Activity Logs", icon: Activity },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <DashboardShell navItems={navItems} title="Admin Panel">
      {children}
    </DashboardShell>
  );
}