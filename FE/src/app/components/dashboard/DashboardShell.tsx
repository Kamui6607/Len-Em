import { useState, type ReactNode } from "react";
import { cn } from "../ui/utils";
import type { NavItem } from "./Sidebar";
import { Sidebar } from "./Sidebar";
import { Profile } from "../../pages/Profile";

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
  const [showProfile, setShowProfile] = useState(false);

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar
        navItems={navItems}
        title={title}
        onProfileClick={() => setShowProfile(true)}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Page content */}
        <main className={cn("flex-1 overflow-y-auto p-4 lg:p-8", className)}>
          {showProfile ? <Profile embedded /> : children}
        </main>
      </div>
    </div>
  );
}
