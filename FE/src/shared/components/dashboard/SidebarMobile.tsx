import { Link, useLocation } from "react-router";
import { Menu, X } from "lucide-react";
import { UserMenu } from "../UserMenu";
import { ThemeToggle } from "../ThemeToggle";
import { cn } from "../ui/utils";
import type { SidebarPresentationProps } from "./SidebarDesktop";

export interface SidebarMobileProps extends SidebarPresentationProps {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
}

function activePath(path: string | undefined, pathname: string) {
  if (!path) return false;
  return path === "/admin" ? pathname === path : pathname.startsWith(path);
}

export function SidebarMobile({
  navItems,
  onProfileClick,
  isDark,
  open,
  onOpen,
  onClose,
}: SidebarMobileProps) {
  const location = useLocation();
  return (
    <>
      <button
        type="button"
        onClick={onOpen}
        className="fixed left-4 top-4 z-40 rounded-xl border p-2.5 shadow-lg lg:hidden"
        style={{
          background: isDark ? "var(--card)" : "var(--accent-cream)",
          color: "var(--primary)",
        }}
        aria-label="Open sidebar"
      >
        <Menu className="h-5 w-5" />
      </button>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex h-screen w-72 flex-col overflow-y-auto border-r transition-transform duration-300 lg:hidden",
          open ? "translate-x-0" : "-translate-x-full",
        )}
        style={{
          background: isDark
            ? "linear-gradient(180deg, #1C1526 0%, #241A34 100%)"
            : "var(--bg-gradient-180)",
          borderColor: "var(--border-light)",
        }}
      >
        <div className="flex items-center justify-between p-4">
          <span className="font-heading text-xl font-bold">Admin Panel</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-2">
          {navItems
            .flatMap((item) => (item.children?.length ? item.children : [item]))
            .map((item) => (
              <Link
                key={item.path ?? item.label}
                to={item.path!}
                onClick={onClose}
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm",
                  activePath(item.path, location.pathname)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted",
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            ))}
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
    </>
  );
}
