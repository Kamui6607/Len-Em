import { Link, useLocation } from "react-router";
import { motion } from "motion/react";
import { BookOpen, ShoppingBag, Palette, LogIn, User } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { UserMenu } from "../UserMenu";

const navItems = [
  { href: "/learn", icon: BookOpen, label: "Learn" },
  { href: "/shop", icon: ShoppingBag, label: "Shop" },
  { href: "/diy", icon: Palette, label: "DIY" },
];

export function BottomNav() {
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();

  const items = [...navItems];
  if (!isAuthenticated && !isLoading) {
    items.push({ href: "/auth/login", icon: LogIn, label: "Login" });
  }

  return (
    <nav className="fixed inset-x-3 bottom-3 z-50 md:hidden safe-area-bottom">
      <div
        className="mx-auto flex max-w-md items-center justify-around gap-1 rounded-[26px] border px-2 py-2 shadow-[0_10px_34px_rgba(24,24,27,0.14)]"
        style={{
          background: "var(--glass-bg)",
          borderColor: "var(--border-light)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        {items.map((item) => {
          const Icon = item.icon;
          const isActive =
            location.pathname === item.href ||
            (item.href !== "/" && location.pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              to={item.href}
              aria-label={item.label}
              className="relative flex flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[10px] font-bold tracking-wide transition-colors min-h-[44px]"
              style={{
                color: isActive ? "var(--primary)" : "var(--foreground-muted)",
              }}
            >
              {isActive && (
                <motion.span
                  layoutId="bottom-nav-active"
                  className="absolute inset-x-2 inset-y-1 -z-10 rounded-2xl"
                  style={{
                    background:
                      "color-mix(in srgb, var(--primary) 12%, transparent)",
                  }}
                  transition={{ type: "spring", stiffness: 420, damping: 32 }}
                />
              )}
              <Icon className="size-5" />
              {item.label}
              {/* Stitch dot — echoes the running-stitch signature from the top nav */}
              <span
                className="absolute -bottom-0.5 h-1 w-1 rounded-full transition-opacity"
                style={{
                  background: "var(--primary)",
                  opacity: isActive ? 1 : 0,
                }}
              />
            </Link>
          );
        })}
        {isLoading && (
          <div className="relative flex flex-1 items-center justify-center">
            <div className="flex flex-col items-center gap-1 opacity-50">
              <User className="size-5 text-[var(--foreground-muted)]" />
              <span className="text-[10px] font-bold tracking-wide text-[var(--foreground-muted)]">...</span>
            </div>
          </div>
        )}
        {!isLoading && isAuthenticated && (
          <div className="relative flex flex-1 items-center justify-center">
            <UserMenu position="bottom" />
          </div>
        )}
      </div>
    </nav>
  );
}