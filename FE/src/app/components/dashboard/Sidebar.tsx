import { useState } from "react";
import { Link, useLocation } from "react-router";
import { cn } from "../ui/utils";
import { UserMenu } from "../UserMenu";
import { ThemeToggle } from "../ThemeToggle";
import { Menu, type LucideIcon } from "lucide-react";

export interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
}

interface SidebarProps {
  navItems: NavItem[];
  title: string;
  onProfileClick?: () => void;
}

export function Sidebar({ navItems, onProfileClick }: SidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/admin") return location.pathname === "/admin";
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile toggle — fixed floating button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="fixed top-4 left-4 z-40 lg:hidden bg-card border border-border p-2.5 rounded-xl shadow-md hover:bg-muted transition-colors"
        aria-label="Open sidebar"
      >
        <Menu className="w-5 h-5 text-foreground" />
      </button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:sticky top-0 inset-y-0 left-0 z-30 w-64 bg-card border-r border-border flex flex-col h-screen overflow-y-auto",
          "transform transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
          "lg:transform-none",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-foreground/70 hover:text-foreground hover:bg-muted",
                )}
              >
                <Icon
                  className={cn(
                    "w-4.5 h-4.5 shrink-0",
                    active && "text-primary",
                  )}
                />
                <span>{item.label}</span>
                {active && (
                  <span className="ml-auto w-1 h-4 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom branding */}
        <div className="px-3 py-3 border-t border-border shrink-0 space-y-1">
          <ThemeToggle variant="row" />
          <UserMenu
            variant="sidebar"
            position="bottom"
            onProfileClick={onProfileClick}
          />
        </div>
      </aside>
    </>
  );
}
