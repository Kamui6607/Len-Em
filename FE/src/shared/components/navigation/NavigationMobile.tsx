import {
  BookOpen,
  LogIn,
  Menu,
  Palette,
  ShoppingBag,
  UserPlus,
  X,
  ArrowLeft,
  Heart,
  Search,
  ShoppingCart,
} from "lucide-react";
import { Link } from "react-router";
import { cn } from "../ui/utils";
import { BottomNav } from "./BottomNav";
import { LanguageToggle } from "../LanguageToggle";
import { ThemeToggle } from "../ThemeToggle";

export interface NavigationMobileProps {
  open: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  activePath: string;
  onOpen: () => void;
  onClose: () => void;
  onLogin: () => void;
  onRegister: () => void;
  onBack: () => void;
  showBackButton: boolean;
  onLogout: () => void;
  searchOpen: boolean;
  searchQuery: string;
  searchPlaceholder: string;
  onSearchToggle: () => void;
  onSearchChange: (value: string) => void;
  onSearchSubmit: (event: React.FormEvent) => void;
  favoriteCount: number;
  cartCount: number;
  t: (key: string, fallback?: string) => string;
}

const links = [
  { label: "Learn", href: "/learn", icon: BookOpen },
  { label: "Shop", href: "/shop", icon: ShoppingBag },
  { label: "DIY", href: "/diy", icon: Palette },
];

export function NavigationMobile(props: NavigationMobileProps) {
  return (
    <>
      <header className="sticky top-0 z-50 border-b border-[var(--border-light)] bg-[color-mix(in_srgb,var(--glass-bg)_75%,transparent)] backdrop-blur-xl md:hidden">
        <div className="flex h-16 items-center justify-between px-4">
          {props.showBackButton ? (
            <button
              type="button"
              onClick={props.onBack}
              className="min-h-11 min-w-11 rounded-full"
              aria-label={props.t("nav.back", "Go back")}
            >
              <ArrowLeft className="mx-auto h-5 w-5" />
            </button>
          ) : (
            <Link to="/" className="font-heading text-2xl font-bold">
              Len<span className="text-primary">&</span>em
            </Link>
          )}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={props.onSearchToggle}
              className="min-h-11 min-w-11 rounded-full"
              aria-label={props.t("nav.search", "Search")}
            >
              <Search className="mx-auto h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={props.open ? props.onClose : props.onOpen}
              className="min-h-11 min-w-11 rounded-full p-2"
              aria-label={props.open ? "Close menu" : "Open menu"}
            >
              {props.open ? (
                <X className="mx-auto h-6 w-6" />
              ) : (
                <Menu className="mx-auto h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </header>
      {props.searchOpen && (
        <form
          onSubmit={props.onSearchSubmit}
          className="border-b bg-background p-3 md:hidden"
        >
          <input
            autoFocus
            value={props.searchQuery}
            onChange={(event) => props.onSearchChange(event.target.value)}
            placeholder={props.searchPlaceholder}
            className="input min-h-11 w-full"
          />
        </form>
      )}
      {props.open && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/35 md:hidden"
            onClick={props.onClose}
          />
          <aside className="fixed inset-y-0 right-0 z-50 flex h-dvh w-[82vw] max-w-sm flex-col border-l bg-background shadow-2xl md:hidden">
            <div className="flex items-center justify-between p-5">
              <span className="font-heading text-2xl font-bold">
                Len<span className="text-primary">&</span>em
              </span>
              <button
                type="button"
                onClick={props.onClose}
                className="min-h-11 min-w-11 rounded-full"
              >
                <X className="mx-auto h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto px-5">
              {links.map(({ label, href, icon: Icon }) => (
                <Link
                  key={href}
                  to={href}
                  onClick={props.onClose}
                  className={cn(
                    "flex min-h-11 items-center gap-3 rounded-2xl px-4 py-3 font-bold",
                    props.activePath.startsWith(href)
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </Link>
              ))}
              {props.isAuthenticated && (
                <div className="grid grid-cols-2 gap-2 pt-3">
                  <Link
                    to="/love"
                    onClick={props.onClose}
                    className="flex min-h-11 items-center justify-center gap-2 rounded-2xl border"
                  >
                    <Heart className="h-4 w-4" />
                    {props.favoriteCount}
                  </Link>
                  <Link
                    to="/cart"
                    onClick={props.onClose}
                    className="flex min-h-11 items-center justify-center gap-2 rounded-2xl border"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    {props.cartCount}
                  </Link>
                </div>
              )}
              {!props.isLoading && !props.isAuthenticated && (
                <div className="grid grid-cols-2 gap-2 pt-3">
                  <button
                    type="button"
                    onClick={props.onLogin}
                    className="flex min-h-11 items-center justify-center gap-2 rounded-2xl border"
                  >
                    <LogIn className="h-4 w-4" />
                    LOGIN
                  </button>
                  <button
                    type="button"
                    onClick={props.onRegister}
                    className="flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-primary text-primary-foreground"
                  >
                    <UserPlus className="h-4 w-4" />
                    REGISTER
                  </button>
                </div>
              )}
              {props.isAuthenticated && (
                <button
                  type="button"
                  onClick={props.onLogout}
                  className="mt-3 flex min-h-11 w-full items-center justify-center rounded-2xl border border-destructive/30 bg-destructive/10 text-destructive"
                >
                  {props.t("nav.logout", "Logout")}
                </button>
              )}
              <div className="mt-3 flex items-center justify-between rounded-2xl border p-3">
                <span className="text-sm">
                  {props.t("nav.languageAndTheme", "Language & theme")}
                </span>
                <div className="flex items-center gap-2">
                  <LanguageToggle />
                  <ThemeToggle />
                </div>
              </div>
            </nav>
          </aside>
        </>
      )}
      {!props.open && <BottomNav />}
    </>
  );
}
