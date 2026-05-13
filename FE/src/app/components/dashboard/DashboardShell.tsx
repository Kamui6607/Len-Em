import type { ReactNode } from "react";
import { cn } from "../ui/utils";
import type { NavItem } from "./Sidebar";
import { Sidebar } from "./Sidebar";
import { DashboardUserMenu } from "./DashboardUserMenu";

interface DashboardShellProps {
  children: ReactNode;
  navItems: NavItem[];
  title: string;
  className?: string;
}

export function DashboardShell({
  children,
  navItems,
  title,
  className,
}: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar navItems={navItems} title={title} />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top bar — avatar dropdown only */}
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-end px-4 lg:px-8 shrink-0">
          <DashboardUserMenu />
        </header>

        {/* Page content */}
        <main
          className={cn(
            "flex-1 overflow-y-auto p-4 lg:p-8",
            className
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}