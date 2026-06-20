import { Link, useLocation } from "react-router";
import { cn } from "../../app/components/ui/utils";
import { BookOpen, ShoppingBag, Palette, LogIn } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { UserMenu } from "../../app/components/UserMenu";

const navItems = [
  { href: "/learn", icon: BookOpen, label: "Learn" },
  { href: "/shop", icon: ShoppingBag, label: "Shop" },
  { href: "/diy", icon: Palette, label: "DIY" },
];

export function BottomNav() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const items = [...navItems];
  if (!isAuthenticated) {
    items.push({ href: "/auth/login", icon: LogIn, label: "Login" });
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/90 backdrop-blur-lg md:hidden safe-area-bottom">
      <div className="flex items-center justify-around py-1">
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
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-2 text-[10px] font-medium transition-colors min-h-[44px] min-w-[44px]",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className={cn("size-6", isActive && "fill-primary/10")} />
              {item.label}
            </Link>
          );
        })}
        {isAuthenticated && (
          <div className="relative">
            <UserMenu position="bottom" />
          </div>
        )}
      </div>
    </nav>
  );
}
