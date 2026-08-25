import { BookOpen, Heart, Palette, ShoppingBag, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Shared navigation link definitions used by both the desktop and mobile
 * navigation bars. The `sectionId` field is only present on Home page links —
 * clicking those scrolls to the matching section instead of navigating away.
 */
export interface NavLink {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Optional Home-page section id — scrolling anchor instead of a route. */
  sectionId?: string;
  protected: boolean;
}

/** Top-level links shown on every non-landing (real) page. */
export const navLinks: NavLink[] = [
  { label: "LEARN", href: "/learn", icon: BookOpen, protected: false },
  { label: "SHOP", href: "/shop", icon: ShoppingBag, protected: true },
  { label: "DIY", href: "/diy", icon: Palette, protected: false },
];

/** Landing page links — scroll to sections on Home, ABOUT US is a real route. */
export const homeNavLinks: NavLink[] = [
  { label: "HOME", href: "/", icon: Sparkles, sectionId: "top", protected: false },
  {
    label: "HOW IT WORKS",
    href: "/",
    icon: Sparkles,
    sectionId: "section-how-it-works",
    protected: false,
  },
  {
    label: "LEARN",
    href: "/",
    icon: BookOpen,
    sectionId: "section-learn",
    protected: false,
  },
  {
    label: "SHOP",
    href: "/",
    icon: ShoppingBag,
    sectionId: "section-shop",
    protected: false,
  },
  {
    label: "DIY",
    href: "/",
    icon: Palette,
    sectionId: "section-diy",
    protected: false,
  },
  { label: "ABOUT US", href: "/about", icon: Heart, protected: false },
];

/** Resolve which link set to display for the current route. */
export function resolveNavLinks(isHomeOrAbout: boolean): NavLink[] {
  return isHomeOrAbout ? homeNavLinks : navLinks;
}