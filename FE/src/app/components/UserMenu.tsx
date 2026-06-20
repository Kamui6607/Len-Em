import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { User, ShoppingBag, LogOut, ChevronDown, Shield, Users as UsersIcon } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../../hooks/useAuth";

interface UserMenuProps {
  position?: "top" | "bottom";
}

export function UserMenu({ position = "top" }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const isOutsideMenu = menuRef.current && !menuRef.current.contains(target);
      const isOutsideDropdown = dropdownRef.current && !dropdownRef.current.contains(target);
      if (isOutsideMenu && isOutsideDropdown) {
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
    navigate("/");
  };

  const roleLabel =
    user.roleId === "admin" ? "Administrator" : user.roleId === "staff" ? "Staff Member" : "Member";
  const RoleIcon = user.roleId === "admin" ? Shield : user.roleId === "staff" ? UsersIcon : User;
  const roleBadgeClass =
    user.roleId === "admin"
      ? "bg-destructive/10 text-destructive"
      : user.roleId === "staff"
      ? "bg-secondary/20 text-secondary-foreground"
      : "bg-primary/10 text-primary";

  const avatarUrl = user
    ? `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=E09F7D&color=fff`
    : "";

  const dropdown = isOpen && (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: position === "top" ? -8 : 8, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: position === "top" ? -8 : 8, scale: 0.95 }}
        transition={{ duration: 0.18 }}
        ref={dropdownRef}
        className={`fixed right-4 w-64 bg-card rounded-2xl shadow-xl border border-border overflow-hidden z-[100] ${
          position === "top" ? "top-20" : "bottom-20"
        }`}
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
              <p className="font-semibold text-foreground truncate">{user.fullName}</p>
              <p className="text-xs text-muted-foreground truncate mt-0.5">{user.email}</p>
              <span
                className={`inline-flex items-center gap-1 mt-1.5 text-xs px-2 py-0.5 rounded-full ${roleBadgeClass}`}
              >
                <RoleIcon className="w-3 h-3" />
                {roleLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Links */}
        <div className="py-2">
          <Link
            to="/profile"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors text-foreground"
          >
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
            <span>My Profile</span>
          </Link>

          <Link
            to="/purchased"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors text-foreground"
          >
            <div className="w-8 h-8 bg-secondary/10 rounded-full flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-secondary" />
            </div>
            <span>Purchased Orders</span>
          </Link>

          <div className="border-t border-border mt-1 pt-1">
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
        </div>
      </motion.div>
    </AnimatePresence>
  );

  return (
    <div className="relative" ref={menuRef}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
      >
        <div className="relative">
          <img
            src={avatarUrl}
            alt={user.fullName}
            className="w-9 h-9 rounded-full border-2 border-primary/20 object-cover"
          />
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-card"></span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground transition-transform hidden sm:block ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {typeof document !== "undefined" && createPortal(dropdown, document.body)}
    </div>
  );
}
