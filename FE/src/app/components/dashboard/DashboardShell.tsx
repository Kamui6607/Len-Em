import { useState, type ReactNode } from "react";
import { cn } from "../ui/utils";
import type { NavItem } from "./Sidebar";
import { Sidebar } from "./Sidebar";
import { Profile } from "../../pages/Profile";
import { useTheme } from "../../context/ThemeContext";

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
  const { isDark } = useTheme();

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <Sidebar
        navItems={navItems}
        title={title}
        onProfileClick={() => setShowProfile(true)}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden relative">
        {/* Animated background orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute rounded-full animate-pulse"
            style={{
              top: "5%",
              right: "10%",
              width: "500px",
              height: "500px",
              background: isDark
                ? "radial-gradient(circle, rgba(155,111,214,0.15) 0%, transparent 70%)"
                : "radial-gradient(circle, rgba(240,196,224,0.2) 0%, transparent 70%)",
              animation: "pulse 8s ease-in-out infinite",
            }}
          />
          <div
            className="absolute rounded-full animate-pulse"
            style={{
              bottom: "10%",
              left: "5%",
              width: "400px",
              height: "400px",
              background: isDark
                ? "radial-gradient(circle, rgba(180,151,232,0.12) 0%, transparent 70%)"
                : "radial-gradient(circle, rgba(255,216,180,0.15) 0%, transparent 70%)",
              animation: "pulse 10s ease-in-out infinite 2s",
            }}
          />
          <div
            className="absolute rounded-full animate-pulse"
            style={{
              top: "50%",
              left: "50%",
              width: "350px",
              height: "350px",
              background: isDark
                ? "radial-gradient(circle, rgba(107,63,160,0.1) 0%, transparent 70%)"
                : "radial-gradient(circle, rgba(245,239,168,0.12) 0%, transparent 70%)",
              animation: "pulse 12s ease-in-out infinite 4s",
            }}
          />
        </div>

        {/* Page content */}
        <main className={cn("flex-1 overflow-y-auto relative z-10", className)}>
          <div className="p-4 lg:p-8">
            {showProfile ? <Profile embedded /> : children}
          </div>
        </main>
      </div>
    </div>
  );
}
