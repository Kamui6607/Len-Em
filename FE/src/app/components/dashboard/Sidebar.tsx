import { useState } from "react";
import { Link, useLocation } from "react-router";
import { cn } from "../ui/utils";
import { UserMenu } from "../UserMenu";
import { ThemeToggle } from "../ThemeToggle";
import { Menu, type LucideIcon } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

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
  const { isDark } = useTheme();

  const isActive = (path: string) => {
    if (path === "/admin") return location.pathname === "/admin";
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile toggle — fixed floating button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className={cn(
          "fixed top-4 left-4 z-40 lg:hidden p-2.5 rounded-xl shadow-lg transition-all duration-200",
          "hover:scale-110 hover:shadow-xl",
          isDark
            ? "bg-[var(--card)] border border-[rgba(155,111,214,0.3)] text-[var(--foreground)]"
            : "bg-[var(--accent-cream)] border border-[rgba(240,196,224,0.3)] text-[var(--primary)]"
        )}
        aria-label="Open sidebar"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:sticky top-0 inset-y-0 left-0 z-30 w-64 flex flex-col h-screen overflow-y-auto",
          "transform transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
          "lg:transform-none",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
        style={{
          background: isDark
            ? "linear-gradient(180deg, #1C1526 0%, #241A34 100%)"
            : "var(--bg-gradient-180)",
          borderRight: isDark
            ? "1px solid rgba(155,111,214,0.2)"
            : "1px solid var(--border-light)",
          boxShadow: isDark
            ? "4px 0 24px rgba(155,111,214,0.15)"
            : "4px 0 20px rgba(107,63,160,0.08)",
        }}
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
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  active ? "scale-[1.02]" : "hover:scale-[1.02]",
                )}
                  style={{
                    background: active
                      ? isDark
                        ? "rgba(155,111,214,0.25)"
                        : "var(--chip-active-bg)"
                      : "transparent",
                    color: active
                      ? isDark ? "#D8C2FF" : "var(--primary)"
                      : isDark ? "rgba(255,255,255,0.65)" : "var(--foreground-muted)",
                  }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = isDark
                      ? "rgba(155,111,214,0.15)"
                      : "rgba(240,196,224,0.2)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                <Icon
                  className="w-4.5 h-4.5 shrink-0 transition-colors duration-200"
                  style={{
                    color: active
                      ? isDark ? "#D8C2FF" : "#6B3FA0"
                      : isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.45)",
                  }}
                />
                <span>{item.label}</span>
                {active && (
                  <span
                    className="ml-auto w-1 h-4 rounded-full transition-all duration-200"
                    style={{
                      background: isDark
                        ? "linear-gradient(180deg, #D8C2FF 0%, #9B6FD6 100%)"
                        : "linear-gradient(180deg, #F0C4E0 0%, #6B3FA0 100%)",
                      boxShadow: isDark
                        ? "0 0 10px rgba(155,111,214,0.6)"
                        : "0 0 10px rgba(240,196,224,0.6)",
                    }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom branding */}
        <div
          className="px-3 py-3 border-t shrink-0 space-y-1"
          style={{
            borderColor: isDark
              ? "rgba(155,111,214,0.15)"
              : "var(--border-light)",
          }}
        >
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
