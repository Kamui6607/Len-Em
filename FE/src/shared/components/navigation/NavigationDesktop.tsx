import {
  BookOpen,
  Heart,
  LogIn,
  Palette,
  Search,
  ShoppingCart,
  ShoppingBag,
  UserPlus,
} from "lucide-react";
import { Link } from "react-router";
import { ThemeToggle } from "../ThemeToggle";
import { LanguageToggle } from "../LanguageToggle";
import { UserMenu } from "../UserMenu";
import { cn } from "../ui/utils";

export interface NavigationDesktopProps {
  isAuthenticated: boolean;
  isLoading: boolean;
  cartCount: number;
  favoriteCount: number;
  searchOpen: boolean;
  searchQuery: string;
  searchPlaceholder: string;
  activePath: string;
  onSearchToggle: () => void;
  onSearchChange: (value: string) => void;
  onSearchSubmit: (event: React.FormEvent) => void;
  onLogin: () => void;
  onRegister: () => void;
}

const links = [
  { label: "LEARN", href: "/learn", icon: BookOpen },
  { label: "SHOP", href: "/shop", icon: ShoppingBag },
  { label: "DIY", href: "/diy", icon: Palette },
];

export function NavigationDesktop(props: NavigationDesktopProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border-light)] bg-[color-mix(in_srgb,var(--glass-bg)_70%,transparent)] backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary-hover)] text-lg font-bold text-white">
            L
          </span>
          <span className="font-heading text-2xl font-bold">
            Len<span className="text-primary">&</span>em
          </span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {links.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              to={href}
              className={cn(
                "flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold tracking-[0.1em]",
                props.activePath.startsWith(href)
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          {props.searchOpen ? (
            <form onSubmit={props.onSearchSubmit} className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                autoFocus
                value={props.searchQuery}
                onChange={(event) => props.onSearchChange(event.target.value)}
                placeholder={props.searchPlaceholder}
                className="input h-10 w-56 rounded-full pl-9"
              />
            </form>
          ) : (
            <button
              type="button"
              onClick={props.onSearchToggle}
              className="nav-icon-btn"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </button>
          )}
          {props.isAuthenticated && (
            <>
              <Link
                to="/love"
                className="relative nav-icon-btn"
                aria-label="Favorites"
              >
                <Heart className="h-5 w-5" />
                {props.favoriteCount > 0 && (
                  <span className="absolute -right-1 -top-1 rounded-full bg-destructive px-1.5 text-[10px] text-white">
                    {props.favoriteCount}
                  </span>
                )}
              </Link>
              <Link
                to="/cart"
                className="relative nav-icon-btn"
                aria-label="Cart"
              >
                <ShoppingCart className="h-5 w-5" />
                {props.cartCount > 0 && (
                  <span className="absolute -right-1 -top-1 rounded-full bg-destructive px-1.5 text-[10px] text-white">
                    {props.cartCount}
                  </span>
                )}
              </Link>
            </>
          )}
          <LanguageToggle />
          <ThemeToggle />
          {props.isLoading ? (
            <span className="h-9 w-20 animate-pulse rounded-full bg-muted" />
          ) : props.isAuthenticated ? (
            <UserMenu position="top" />
          ) : (
            <>
              <button
                type="button"
                onClick={props.onLogin}
                className="flex items-center gap-2 px-3 py-2 text-sm font-bold"
              >
                <LogIn className="h-4 w-4" />
                LOGIN
              </button>
              <button
                type="button"
                onClick={props.onRegister}
                className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
              >
                <UserPlus className="h-4 w-4" />
                REGISTER
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
