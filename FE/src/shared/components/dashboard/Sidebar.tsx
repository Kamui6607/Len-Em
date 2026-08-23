import { useState } from "react";
import { Link, useLocation } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../ui/utils";
import { UserMenu } from "../UserMenu";
import { ThemeToggle } from "../ThemeToggle";
import { Menu, ChevronDown, type LucideIcon } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";

export interface NavItem {
  path?: string;
  label: string;
  icon: LucideIcon;
  children?: NavItem[];
  highlighted?: boolean;
}

interface SidebarProps {
  navItems: NavItem[];
  title: string;
  onProfileClick?: () => void;
}

function ParentNavItem({ 
  item, 
  setIsMobileOpen, 
  isDark 
}: { 
  item: NavItem; 
  setIsMobileOpen: (open: boolean) => void;
  isDark: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const location = useLocation();
  
  const isChildActive = item.children?.some(child => 
    child.path && location.pathname.startsWith(child.path)
  );

  const isHighlighted = item.highlighted;

  return (
    <div className="space-y-1">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
          isChildActive ? "scale-[1.02]" : "hover:scale-[1.02]",
          isHighlighted && "ring-2 ring-primary/50",
        )}
        style={{
          background: isChildActive
            ? isDark
              ? "rgba(124,99,255,0.25)"
              : "var(--chip-active-bg)"
            : isHighlighted
              ? isDark
                ? "rgba(124,99,255,0.15)"
                : "rgba(91,61,245,0.08)"
              : "transparent",
          color: isChildActive
            ? isDark ? "#C9BBFF" : "var(--primary)"
            : isHighlighted
              ? isDark ? "#C9BBFF" : "var(--primary)"
              : isDark ? "rgba(255,255,255,0.65)" : "var(--foreground-muted)",
          boxShadow: isHighlighted && !isChildActive
            ? isDark
              ? "0 0 12px rgba(124,99,255,0.2)"
              : "0 0 12px rgba(91,61,245,0.15)"
            : "none",
        }}
        onMouseEnter={(e) => {
          if (!isChildActive) {
            e.currentTarget.style.background = isDark
              ? "rgba(124,99,255,0.15)"
              : "rgba(232,222,255,0.2)";
          }
        }}
        onMouseLeave={(e) => {
          if (!isChildActive) {
            e.currentTarget.style.background = isHighlighted
              ? isDark
                ? "rgba(124,99,255,0.15)"
                : "rgba(91,61,245,0.08)"
              : "transparent";
          }
        }}
      >
        <item.icon
          className="w-4.5 h-4.5 shrink-0 transition-colors duration-200"
          style={{
            color: isChildActive
              ? isDark ? "#C9BBFF" : "#5B3DF5"
              : isHighlighted
                ? isDark ? "#C9BBFF" : "#5B3DF5"
                : isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.45)",
          }}
        />
        <span className="flex-1 text-left">{item.label}</span>
        {isHighlighted && (
          <span
            className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
            style={{
              background: isDark
                ? "rgba(124,99,255,0.3)"
                : "rgba(91,61,245,0.15)",
              color: isDark ? "#C9BBFF" : "#5B3DF5",
            }}
          >
            NEW
          </span>
        )}
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </button>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="pl-4 pr-1 py-1 space-y-1">
              {item.children?.map((child) => {
                const childActive = child.path ? location.pathname.startsWith(child.path) : false;
                const ChildIcon = child.icon;
                
                return (
                  <Link
                    key={child.path}
                    to={child.path!}
                    onClick={() => setIsMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                      childActive ? "scale-[1.02]" : "hover:scale-[1.02]",
                    )}
                    style={{
                      background: childActive
                        ? isDark
                          ? "rgba(124,99,255,0.2)"
                          : "var(--chip-active-bg)"
                        : "transparent",
                      color: childActive
                        ? isDark ? "#C9BBFF" : "var(--primary)"
                        : isDark ? "rgba(255,255,255,0.65)" : "var(--foreground-muted)",
                    }}
                    onMouseEnter={(e) => {
                      if (!childActive) {
                        e.currentTarget.style.background = isDark
                          ? "rgba(124,99,255,0.1)"
                          : "rgba(232,222,255,0.15)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!childActive) {
                        e.currentTarget.style.background = "transparent";
                      }
                    }}
                  >
                    <ChildIcon
                      className="w-4 h-4 shrink-0 transition-colors duration-200"
                      style={{
                        color: childActive
                          ? isDark ? "#C9BBFF" : "#5B3DF5"
                          : isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.45)",
                      }}
                    />
                    <span>{child.label}</span>
                    {childActive && (
                      <span
                        className="ml-auto w-1 h-3 rounded-full transition-all duration-200"
                        style={{
                          background: isDark
                            ? "linear-gradient(180deg, #C9BBFF 0%, #7C63FF 100%)"
                            : "linear-gradient(180deg, #E8DEFF 0%, #5B3DF5 100%)",
                          boxShadow: isDark
                            ? "0 0 8px rgba(124,99,255,0.6)"
                            : "0 0 8px rgba(91,61,245,0.6)",
                        }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
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
            ? "bg-[var(--card)] border border-[rgba(124,99,255,0.3)] text-[var(--foreground)]"
            : "bg-[var(--accent-cream)] border border-[rgba(232,222,255,0.3)] text-[var(--primary)]"
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
            ? "1px solid rgba(124,99,255,0.2)"
            : "1px solid var(--border-light)",
          boxShadow: isDark
            ? "4px 0 24px rgba(124,99,255,0.15)"
            : "4px 0 20px rgba(91,61,245,0.08)",
        }}
      >

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const hasChildren = item.children && item.children.length > 0;
            
            if (hasChildren) {
              return (
              <ParentNavItem
                  key={item.label}
                  item={item}
                  setIsMobileOpen={setIsMobileOpen}
                  isDark={isDark}
                />
              );
            }
            
            const active = item.path ? isActive(item.path) : false;
            return (
              <Link
                key={item.path}
                to={item.path!}
                onClick={() => setIsMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  active ? "scale-[1.02]" : "hover:scale-[1.02]",
                )}
                  style={{
                    background: active
                      ? isDark
                        ? "rgba(124,99,255,0.25)"
                        : "var(--chip-active-bg)"
                      : "transparent",
                    color: active
                      ? isDark ? "#C9BBFF" : "var(--primary)"
                      : isDark ? "rgba(255,255,255,0.65)" : "var(--foreground-muted)",
                  }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = isDark
                      ? "rgba(124,99,255,0.15)"
                      : "rgba(232,222,255,0.2)";
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
                      ? isDark ? "#C9BBFF" : "#5B3DF5"
                      : isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.45)",
                  }}
                />
                <span>{item.label}</span>
                {active && (
                  <span
                    className="ml-auto w-1 h-4 rounded-full transition-all duration-200"
                    style={{
                      background: isDark
                        ? "linear-gradient(180deg, #C9BBFF 0%, #7C63FF 100%)"
                        : "linear-gradient(180deg, #E8DEFF 0%, #5B3DF5 100%)",
                      boxShadow: isDark
                        ? "0 0 10px rgba(124,99,255,0.6)"
                        : "0 0 10px rgba(91,61,245,0.6)",
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
              ? "rgba(124,99,255,0.15)"
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
