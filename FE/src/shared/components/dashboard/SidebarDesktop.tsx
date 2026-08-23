import { Link, useLocation } from "react-router";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { UserMenu } from "../UserMenu";
import { ThemeToggle } from "../ThemeToggle";
import { cn } from "../ui/utils";
import type { NavItem } from "./Sidebar";

export interface SidebarPresentationProps {
  navItems: NavItem[];
  onProfileClick?: () => void;
  isDark: boolean;
}

function activePath(path: string | undefined, pathname: string) {
  if (!path) return false;
  return path === "/admin" ? pathname === path : pathname.startsWith(path);
}

export function SidebarDesktop({
  navItems,
  onProfileClick,
  isDark,
}: SidebarPresentationProps) {
  const location = useLocation();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  return (
    <aside
      className="sticky top-0 z-30 flex h-screen w-64 shrink-0 flex-col overflow-y-auto border-r"
      style={{
        background: isDark
          ? "linear-gradient(180deg, #1C1526 0%, #241A34 100%)"
          : "var(--bg-gradient-180)",
        borderColor: "var(--border-light)",
      }}
    >
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const hasChildren = Boolean(item.children?.length);
          const active = item.path
            ? activePath(item.path, location.pathname)
            : item.children?.some((child) =>
                activePath(child.path, location.pathname),
              );
          if (hasChildren) {
            const open = expanded[item.label] ?? Boolean(active);
            return (
              <div key={item.label} className="space-y-1">
                <button
                  type="button"
                  onClick={() =>
                    setExpanded((current) => ({
                      ...current,
                      [item.label]: !open,
                    }))
                  }
                  className={cn(
                    "flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
                    active && "bg-primary/10 text-primary",
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform",
                      open && "rotate-180",
                    )}
                  />
                </button>
                {open && (
                  <div className="space-y-1 pl-4">
                    {item.children?.map((child) => (
                      <Link
                        key={child.path}
                        to={child.path!}
                        className={cn(
                          "flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm",
                          activePath(child.path, location.pathname)
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-muted",
                        )}
                      >
                        <child.icon className="h-4 w-4" />
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          }
          return (
            <Link
              key={item.path}
              to={item.path!}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div
        className="space-y-1 border-t p-3"
        style={{ borderColor: "var(--border-light)" }}
      >
        <ThemeToggle variant="row" />
        <UserMenu
          variant="sidebar"
          position="bottom"
          onProfileClick={onProfileClick}
        />
      </div>
    </aside>
  );
}
