import { useState, useRef, useEffect } from "react";
import { LogOut, ChevronDown, Shield, Users } from "lucide-react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../../hooks/useAuth";
import { ThemeToggle } from "./ThemeToggle";

interface DashboardAvatarMenuProps {
  accentColor?: "primary" | "secondary";
}

export function DashboardAvatarMenu({
  accentColor = "primary",
}: DashboardAvatarMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  const handleLogout = () => {
    signOut();
    setIsOpen(false);
    navigate("/auth/login", { replace: true });
  };

  const roleLabel =
    user.roleId === "admin"
      ? "Administrator"
      : user.roleId === "staff"
        ? "Staff Member"
        : "User";
  const RoleIcon = user.roleId === "admin" ? Shield : Users;
  const roleBadgeClass =
    user.roleId === "admin"
      ? "bg-destructive/10 text-destructive"
      : "bg-secondary/20 text-secondary-foreground";

  const avatarUrl = user
    ? `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=E09F7D&color=fff`
    : "";

  return (
    <div className="flex items-center gap-2">
      {/* Theme toggle to the LEFT of avatar */}
      <ThemeToggle size="sm" />

      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <div className="relative">
            <img
              src={avatarUrl}
              alt={user.fullName}
              className={`w-9 h-9 rounded-full border-2 ${accentColor === "secondary" ? "border-secondary/30" : "border-primary/30"} object-cover`}
            />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-card"></span>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-muted-foreground transition-transform hidden sm:block ${isOpen ? "rotate-180" : ""}`}
          />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.18 }}
              className="absolute right-0 mt-3 w-64 bg-card rounded-2xl shadow-xl border border-border overflow-hidden z-50"
            >
              {/* User info */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <img
                    src={avatarUrl}
                    alt={user.fullName}
                    className="w-12 h-12 rounded-full border-2 border-border object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">
                      {user.fullName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {user.email}
                    </p>
                    <span
                      className={`inline-flex items-center gap-1 mt-1.5 text-xs px-2 py-0.5 rounded-full ${roleBadgeClass}`}
                    >
                      <RoleIcon className="w-3 h-3" />
                      {roleLabel}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="py-2">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-destructive/10 transition-colors text-foreground group"
                >
                  <div className="w-8 h-8 bg-destructive/10 rounded-full flex items-center justify-center group-hover:bg-destructive/20 transition-colors">
                    <LogOut className="w-4 h-4 text-destructive" />
                  </div>
                  <span className="text-destructive">Sign Out</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
