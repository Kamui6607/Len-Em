import { useState, useEffect, useCallback, useRef } from "react";
import { Users, UserCheck, UserX, Lock, BarChart3 } from "lucide-react";
import { createPortal } from "react-dom";
import {
  Search,
  Trash2,
  Eye,
  ShieldCheck,
  BadgeCheck,
  User,
  ShoppingBag,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Venus,
  X,
  ChevronDown,
  ChevronUp,
  Check,
} from "lucide-react";
import {
  userService,
  type ApiUser,
  type UserStatus,
} from "../../../features/users/services/user.service";
import { useAdmin } from "../../context/AdminContext";
import { useAuth } from "../../../hooks/useAuth";
import { toast } from "sonner";
import type { UserStatistics } from "../../../features/users/services/user.service";

// ─── Role config ──────────────────────────────────────────────────────────────

const ROLE_OPTIONS = [
  { id: "6a250549d5316cfeb83101c0", name: "Admin" },
  { id: "6a250549d5316cfeb83101c1", name: "Staff" },
  { id: "6a250549d5316cfeb83101c2", name: "Customer" },
];

const ROLE_NAME_MAP = ROLE_OPTIONS.reduce<Record<string, string>>(
  (acc, role) => ({ ...acc, [role.id]: role.name }),
  {},
);

function extractRoleName(
  roleId: { _id: string; roleName: string } | string | undefined,
): string {
  if (!roleId) return "User";
  if (typeof roleId === "string") return ROLE_NAME_MAP[roleId] || "User";
  return roleId.roleName || "User";
}

function extractRoleId(
  roleId: { _id: string; roleName: string } | string | undefined,
): string {
  if (!roleId) return "";
  return typeof roleId === "string" ? roleId : roleId._id;
}

// ─── Style maps ───────────────────────────────────────────────────────────────

const ROLE_STYLE: Record<string, { badge: string; avatar: string; item: string; icon: React.ReactNode }> = {
  Admin: {
    badge: "bg-violet-100 text-violet-700 border-violet-300 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-800",
    avatar: "bg-violet-100 text-violet-700 border-violet-300 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-800",
    item: "text-violet-700 dark:text-violet-300",
    icon: <ShieldCheck className="w-3 h-3" />,
  },
  Staff: {
    badge: "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
    avatar: "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
    item: "text-blue-700 dark:text-blue-300",
    icon: <BadgeCheck className="w-3 h-3" />,
  },
  User: {
    badge: "bg-green-100 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-300 dark:border-green-800",
    avatar: "bg-green-100 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-300 dark:border-green-800",
    item: "text-green-700 dark:text-green-300",
    icon: <User className="w-3 h-3" />,
  },
  Customer: {
    badge: "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
    avatar: "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
    item: "text-amber-700 dark:text-amber-300",
    icon: <ShoppingBag className="w-3 h-3" />,
  },
};

const STATUS_STYLE: Record<string, { badge: string; dot: string; item: string }> = {
  ACTIVE: {
    badge: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
    dot: "bg-green-500",
    item: "text-green-700 dark:text-green-300",
  },
  INACTIVE: {
    badge: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
    dot: "bg-red-500",
    item: "text-red-700 dark:text-red-300",
  },
  LOCKED: {
    badge: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    dot: "bg-gray-400",
    item: "text-gray-600 dark:text-gray-400",
  },
};

function getRoleStyle(roleName: string) {
  return (
    ROLE_STYLE[roleName] ?? {
      badge: "bg-muted text-muted-foreground border-border",
      avatar: "bg-muted text-muted-foreground border-border",
      item: "text-muted-foreground",
      icon: <User className="w-3 h-3" />,
    }
  );
}

function getStatusStyle(status: string) {
  return STATUS_STYLE[status] ?? STATUS_STYLE.ACTIVE;
}

// ─── Badges ───────────────────────────────────────────────────────────────────

function RoleBadge({ roleName }: { roleName: string }) {
  const s = getRoleStyle(roleName);
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${s.badge}`}>
      {s.icon}
      {roleName}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = getStatusStyle(status);
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${s.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot}`} />
      {status}
    </span>
  );
}

function UserAvatar({ name, roleName }: { name: string; roleName: string }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const s = getRoleStyle(roleName);
  return (
    <div className={`w-11 h-11 rounded-full border-2 flex items-center justify-center text-sm font-semibold flex-shrink-0 ${s.avatar}`}>
      {initials || "?"}
    </div>
  );
}

// ─── Filter Select ────────────────────────────────────────────────────────────

function FilterSelect({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { value: string; label: string; dot?: string }[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value) ?? options[0];

  const updateCoords = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setCoords({ top: rect.bottom + 6, left: rect.left, width: rect.width });
  };

  useEffect(() => {
    function handler(e: MouseEvent) {
      const t = e.target as Node;
      if (
        triggerRef.current && !triggerRef.current.contains(t) &&
        menuRef.current && !menuRef.current.contains(t)
      ) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => { if (!open) updateCoords(); setOpen((p) => !p); }}
        className={`w-full flex items-center justify-between px-4 py-3 bg-input-background border rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 ${
          open
            ? "border-primary ring-2 ring-primary/20"
            : "border-border hover:border-muted-foreground/40"
        }`}
      >
        <span className="flex items-center gap-2">
          {selected.dot && (
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${selected.dot}`} />
          )}
          <span className={value === "all" || !value ? "text-muted-foreground" : "text-foreground"}>
            {selected.label}
          </span>
        </span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && typeof document !== "undefined" && createPortal(
        <div
          ref={menuRef}
          style={{ position: "fixed", top: coords.top, left: coords.left, width: coords.width, zIndex: 9999 }}
          className="bg-card border border-border rounded-xl shadow-lg overflow-hidden py-1"
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors hover:bg-muted/60 ${
                opt.value === value ? "text-foreground font-medium" : "text-muted-foreground"
              }`}
            >
              {opt.dot && (
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${opt.dot}`} />
              )}
              <span className="flex-1 text-left">{opt.label}</span>
              {opt.value === value && <Check className="w-3.5 h-3.5 opacity-60 flex-shrink-0" />}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </>
  );
}

// ─── Custom dropdown (table cells) ───────────────────────────────────────────

interface DropdownOption {
  value: string;
  label: string;
  badgeClass: string;
  itemClass: string;
  prefix?: React.ReactNode;
}

function CustomDropdown({
  value,
  options,
  onChange,
}: {
  value: string;
  options: DropdownOption[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value) ?? options[0];

  const MENU_WIDTH = 140;
  const GAP = 6;

  const updateCoords = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const menuHeight = options.length * 36 + 8;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const top =
      spaceBelow >= menuHeight || spaceBelow >= spaceAbove
        ? rect.bottom + GAP
        : rect.top - menuHeight - GAP;
    const left = Math.min(rect.left, window.innerWidth - MENU_WIDTH - 8);
    setCoords({ top, left });
  };

  useEffect(() => {
    function handler(e: MouseEvent) {
      const target = e.target as Node;
      const outsideWrap = wrapRef.current && !wrapRef.current.contains(target);
      const outsideMenu = menuRef.current && !menuRef.current.contains(target);
      if (outsideWrap && outsideMenu) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  const toggleOpen = () => {
    if (!open) updateCoords();
    setOpen((p) => !p);
  };

  return (
    <>
      <div ref={wrapRef} className="inline-block">
        <button
          ref={triggerRef}
          type="button"
          onClick={toggleOpen}
          className={`inline-flex items-center gap-1.5 pl-2.5 pr-2 py-0.5 rounded-full text-xs font-medium border cursor-pointer transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-primary/50 ${selected.badgeClass}`}
        >
          {selected.prefix}
          {selected.label}
          <ChevronDown className={`w-3 h-3 transition-transform flex-shrink-0 ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      {open && typeof document !== "undefined" && createPortal(
        <div
          ref={menuRef}
          style={{ position: "fixed", top: coords.top, left: coords.left, width: MENU_WIDTH, zIndex: 9999 }}
          className="bg-card border border-border rounded-xl shadow-lg overflow-hidden py-1"
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs font-medium hover:bg-muted/60 transition-colors ${opt.itemClass}`}
            >
              <span className="flex-shrink-0">{opt.prefix}</span>
              <span className="flex-1 text-left">{opt.label}</span>
              {opt.value === value && <Check className="w-3 h-3 flex-shrink-0 opacity-70" />}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </>
  );
}

// ─── Dropdown option builders ─────────────────────────────────────────────────

function buildRoleOptions(): DropdownOption[] {
  return ROLE_OPTIONS.map((r) => {
    const s = getRoleStyle(r.name);
    return {
      value: r.id,
      label: r.name,
      badgeClass: s.badge,
      itemClass: s.item,
      prefix: <span className="flex-shrink-0">{s.icon}</span>,
    };
  });
}

function buildStatusOptions(): DropdownOption[] {
  return ["ACTIVE", "INACTIVE", "LOCKED"].map((st) => {
    const s = getStatusStyle(st);
    return {
      value: st,
      label: st,
      badgeClass: s.badge,
      itemClass: s.item,
      prefix: <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot}`} />,
    };
  });
}

const ROLE_DROPDOWN_OPTIONS = buildRoleOptions();
const STATUS_DROPDOWN_OPTIONS = buildStatusOptions();

// ─── Sortable table header ────────────────────────────────────────────────────

type SortField = "name" | "email" | "phone" | "role" | "status";
type SortDirection = "asc" | "desc";

function SortableHeader({
  label,
  field,
  sortField,
  sortDirection,
  onSort,
  align = "left",
}: {
  label: string;
  field: SortField;
  sortField: SortField | null;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  align?: "left" | "right";
}) {
  const active = sortField === field;
  return (
    <th className={`px-6 py-4 text-sm font-medium text-muted-foreground ${align === "right" ? "text-right" : "text-left"}`}>
      <button
        type="button"
        onClick={() => onSort(field)}
        className={`group inline-flex items-center gap-1 transition-colors hover:text-foreground focus:outline-none ${active ? "text-foreground" : ""} ${align === "right" ? "flex-row-reverse" : ""}`}
      >
        {label}
        <span className="flex flex-col items-center justify-center -space-y-[3px]">
          <ChevronUp className={`w-2.5 h-2.5 ${active && sortDirection === "asc" ? "text-primary" : "text-muted-foreground/40 group-hover:text-muted-foreground"}`} />
          <ChevronDown className={`w-2.5 h-2.5 ${active && sortDirection === "desc" ? "text-primary" : "text-muted-foreground/40 group-hover:text-muted-foreground"}`} />
        </span>
      </button>
    </th>
  );
}

// ─── Detail modal ─────────────────────────────────────────────────────────────

function UserDetailModal({ user, onClose }: { user: ApiUser; onClose: () => void }) {
  const roleName = extractRoleName(user.roleId);

  const detailRows = [
    { icon: <Mail className="w-3.5 h-3.5" />, label: "Email", value: user.email || "—" },
    { icon: <Phone className="w-3.5 h-3.5" />, label: "Phone", value: user.phone || "—" },
    { icon: <MapPin className="w-3.5 h-3.5" />, label: "Address", value: user.address || "—" },
    { icon: <Venus className="w-3.5 h-3.5" />, label: "Gender", value: user.gender || "—" },
    { icon: <Calendar className="w-3.5 h-3.5" />, label: "Date of birth", value: user.dateOfBirth || "—" },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative px-6 pt-6 pb-5 border-b border-border">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-muted transition-colors text-muted-foreground"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-4">
            <UserAvatar name={user.fullName || ""} roleName={roleName} />
            <div className="min-w-0">
              <p className="font-semibold text-base leading-tight truncate">{user.fullName}</p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">@{user.username}</p>
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                <RoleBadge roleName={roleName} />
                <StatusBadge status={user.status ?? "ACTIVE"} />
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 space-y-3">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
            Account info
          </p>
          <div className="text-xs text-muted-foreground font-mono bg-muted/40 rounded-lg px-3 py-2 truncate">
            ID: {user.userId}
          </div>
          {detailRows.map((row) => (
            <div key={row.label} className="flex items-start gap-3 py-1.5 border-b border-border/60 last:border-0">
              <span className="mt-0.5 text-muted-foreground flex-shrink-0">{row.icon}</span>
              <span className="text-xs text-muted-foreground w-24 flex-shrink-0">{row.label}</span>
              <span className="text-xs font-medium text-right flex-1 break-all">{row.value}</span>
            </div>
          ))}
        </div>

        <div className="px-6 pb-5">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-full text-sm border border-border hover:bg-muted transition-colors text-muted-foreground"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AdminUsers() {
  const { logActivity } = useAdmin();
  const { hasRole } = useAuth();
  const isAdmin = hasRole("admin");
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | UserStatus>("all");
  const [roleFilter, setRoleFilter] = useState("");
  const [selectedUser, setSelectedUser] = useState<ApiUser | null>(null);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [stats, setStats] = useState<UserStatistics | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const { data: response } = await userService.getAllUsers({
        page: 1,
        limit: 20,
        status: statusFilter === "all" ? undefined : statusFilter,
        roleId: roleFilter || undefined,
      });
      setUsers(response.data.result.users || []);
    } catch {
      // API unavailable — empty state
    } finally {
      setLoading(false);
    }
  }, [roleFilter, statusFilter]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // ── Fetch user statistics (admin & staff) ──
  useEffect(() => {
    let cancelled = false;
    setStatsLoading(true);
    userService
      .getStatistics()
      .then((res) => {
        if (!cancelled) setStats(res.data.data);
      })
      .catch(() => {
        if (!cancelled) toast.error("Failed to load user statistics");
      })
      .finally(() => {
        if (!cancelled) setStatsLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const filteredUsers = users.filter(
    (u) =>
      u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.phone?.includes(searchTerm),
  );

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (!sortField) return 0;
    const getValue = (u: ApiUser) => {
      switch (sortField) {
        case "name": return u.fullName ?? "";
        case "email": return u.email ?? "";
        case "phone": return u.phone ?? "";
        case "role": return extractRoleName(u.roleId);
        case "status": return u.status ?? "ACTIVE";
      }
    };
    const cmp = getValue(a).localeCompare(getValue(b));
    return sortDirection === "asc" ? cmp : -cmp;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleViewUser = async (user: ApiUser) => {
    if (!isAdmin) return;
    try {
      const { data: response } = await userService.getUserById(user.userId);
      setSelectedUser(response.data.result);
    } catch {
      toast.error("Failed to load user detail");
    }
  };

  const handleStatusChange = async (user: ApiUser, status: UserStatus) => {
    if (!isAdmin) return;
    try {
      await userService.updateUserStatus(user.userId, {
        status,
        description: `Admin changed status to ${status}`,
      });
      setUsers((prev) =>
        prev.map((u) => (u.userId === user.userId ? { ...u, status } : u)),
      );
      logActivity({
        type: "user_created",
        userId: "admin",
        userName: "Admin",
        description: `Updated status for ${user.fullName} to ${status}`,
      });
      toast.success("User status updated");
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleRoleChange = async (user: ApiUser, roleId: string) => {
    if (!isAdmin || !roleId) return;
    const currentRoleId = extractRoleId(user.roleId);
    if (currentRoleId === roleId) return; // trùng role → bỏ qua, không lỗi
    try {
      await userService.updateUserRole(user.userId, { roleId });
      setUsers((prev) =>
        prev.map((u) =>
          u.userId === user.userId
            ? { ...u, roleId: { _id: roleId, roleName: ROLE_NAME_MAP[roleId] || "User" } }
            : u,
        ),
      );
      logActivity({
        type: "user_created",
        userId: "admin",
        userName: "Admin",
        description: `Changed role for ${user.fullName} to ${ROLE_NAME_MAP[roleId] || roleId}`,
      });
      toast.success("User role updated");
    } catch {
      toast.error("Failed to update role");
    }
  };

  const handleDeleteUser = async (user: ApiUser) => {
    if (!isAdmin) return;
    if (!confirm(`Are you sure you want to soft delete ${user.fullName}?`)) return;
    try {
      await userService.deleteUser(user.userId);
      setUsers((prev) =>
        prev.map((u) =>
          u.userId === user.userId ? { ...u, status: "INACTIVE" } : u,
        ),
      );
      logActivity({
        type: "user_created",
        userId: "admin",
        userName: "Admin",
        description: `Soft deleted user: ${user.fullName}`,
      });
      toast.success("User set to inactive");
    } catch {
      toast.error("Failed to delete user");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="mb-2">User Management</h1>
          <p className="text-muted-foreground">
            {isAdmin ? "Manage users, statuses, and roles" : "View registered users"}
          </p>
        </div>
      </div>

      {/* User Statistics (Admin & Staff) */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="px-6 pt-5 pb-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              User Statistics
            </h3>
          </div>
          {statsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-pulse">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-muted/30 rounded-xl p-3 border border-border/50 space-y-2">
                  <div className="h-3 w-14 bg-muted rounded" />
                  <div className="h-6 w-8 bg-muted rounded" />
                </div>
              ))}
            </div>
          ) : stats ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-muted/30 rounded-xl p-3 border border-border/50">
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-1">
                    <Users className="w-3 h-3" />
                    Total
                  </div>
                  <p className="text-lg font-bold">{stats.totalUsers}</p>
                </div>
                <div className="bg-muted/30 rounded-xl p-3 border border-border/50">
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-1">
                    <UserCheck className="w-3 h-3" />
                    Active
                  </div>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">{stats.activeUsers}</p>
                </div>
                <div className="bg-muted/30 rounded-xl p-3 border border-border/50">
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-1">
                    <UserX className="w-3 h-3" />
                    Inactive
                  </div>
                  <p className="text-lg font-bold text-red-600 dark:text-red-400">{stats.inactiveUsers}</p>
                </div>
                <div className="bg-muted/30 rounded-xl p-3 border border-border/50">
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-1">
                    <Lock className="w-3 h-3" />
                    Locked
                  </div>
                  <p className="text-lg font-bold text-gray-500">{stats.lockedUsers}</p>
                </div>
              </div>
              {stats.usersByRole.length > 0 && (
                <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border/50">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">By Role:</span>
                  {stats.usersByRole.map((r) => (
                    <span key={r.roleName} className="text-xs text-muted-foreground">
                      {r.roleName}: <strong className="text-foreground">{r.count}</strong>
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-4">
              Failed to load statistics
            </p>
          )}
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        {/* Filters */}
        <div className="p-6 border-b border-border space-y-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <FilterSelect
              value={statusFilter}
              options={[
                { value: "all", label: "All statuses" },
                { value: "ACTIVE", label: "ACTIVE", dot: "bg-green-500" },
                { value: "INACTIVE", label: "INACTIVE", dot: "bg-red-500" },
                { value: "LOCKED", label: "LOCKED", dot: "bg-gray-400" },
              ]}
              onChange={(v) => setStatusFilter(v as "all" | UserStatus)}
            />
            <FilterSelect
              value={roleFilter || "all"}
              options={[
                { value: "all", label: "All roles" },
                ...ROLE_OPTIONS.map((r) => ({ value: r.id, label: r.name })),
              ]}
              onChange={(v) => setRoleFilter(v === "all" ? "" : v)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <SortableHeader label="User" field="name" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                <SortableHeader label="Email" field="email" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                <SortableHeader label="Phone" field="phone" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                <SortableHeader label="Role" field="role" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                <SortableHeader label="Status" field="status" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedUsers.length > 0 ? (
                sortedUsers.map((user) => {
                  const roleName = extractRoleName(user.roleId);
                  const currentStatus = user.status ?? "ACTIVE";
                  return (
                    <tr key={user.userId} className="border-t border-border hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <UserAvatar name={user.fullName || ""} roleName={roleName} />
                          <div>
                            <p className="font-medium text-sm">{user.fullName}</p>
                            <p className="text-xs text-muted-foreground">@{user.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{user.email}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{user.phone || "—"}</td>
                      <td className="px-6 py-4">
                        {isAdmin ? (
                          <CustomDropdown
                            value={extractRoleId(user.roleId)}
                            options={ROLE_DROPDOWN_OPTIONS}
                            onChange={(roleId) => handleRoleChange(user, roleId)}
                          />
                        ) : (
                          <RoleBadge roleName={roleName} />
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {isAdmin ? (
                          <CustomDropdown
                            value={currentStatus}
                            options={STATUS_DROPDOWN_OPTIONS}
                            onChange={(status) => handleStatusChange(user, status as UserStatus)}
                          />
                        ) : (
                          <StatusBadge status={currentStatus} />
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isAdmin ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleViewUser(user)}
                              className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                              title="View detail"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user)}
                              className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-950 text-muted-foreground hover:text-red-600 dark:hover:text-red-400 transition-colors"
                              title="Soft delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">View only</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-muted-foreground">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedUser && (
        <UserDetailModal user={selectedUser} onClose={() => setSelectedUser(null)} />
      )}
    </div>
  );
}