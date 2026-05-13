import type { ReactNode } from "react";
import type { NavItem } from "../dashboard/Sidebar";
import { DashboardShell } from "../dashboard/DashboardShell";

interface DashboardLayoutProps {
  children: ReactNode;
  navItems: NavItem[];
  title: string;
}

export function DashboardLayout({
  children,
  navItems,
  title,
}: DashboardLayoutProps) {
  return (
    <DashboardShell navItems={navItems} title={title}>
      {children}
    </DashboardShell>
  );
}