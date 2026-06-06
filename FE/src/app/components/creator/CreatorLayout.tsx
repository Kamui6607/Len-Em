import type { ReactNode } from "react";
import { Link, useLocation } from "react-router";
import { BarChart3, BookOpen, Package, Sparkles, Settings } from "lucide-react";
import { DashboardShell } from "../dashboard/DashboardShell";
import type { NavItem } from "../dashboard/Sidebar";
import { cn } from "../ui/utils";

interface CreatorLayoutProps {
  children: ReactNode;
}

const navItems: NavItem[] = [
  { path: "/creator", label: "Overview", icon: BarChart3 },
  { path: "/creator/courses", label: "Courses", icon: BookOpen },
  { path: "/creator/products", label: "Products", icon: Package },
  { path: "/creator/diy", label: "DIY", icon: Sparkles },
  { path: "/creator/settings", label: "Settings", icon: Settings },
];

const mobileItems = navItems.slice(0, 4);

export function CreatorLayout({ children }: CreatorLayoutProps) {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/creator") return location.pathname === "/creator";
    return location.pathname.startsWith(path);
  };

  return (
    <div className="creator-dashboard">
      <DashboardShell navItems={navItems} title="Creator Studio" className="pb-24 md:pb-8">
        {children}
      </DashboardShell>

      <nav className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-4 rounded-3xl border border-[#d9c8ae] bg-[#fff8ed]/95 p-2 shadow-2xl shadow-[#8f4f3d]/15 backdrop-blur md:hidden">
        {mobileItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-semibold transition",
                active ? "bg-[#b7664e] text-white" : "text-[#6d5c4d] hover:bg-[#eadcc7]",
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
