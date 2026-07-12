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
  Plus,
  Edit3,
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
import { authService } from "../../../services/auth.service";

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
    badge: "badge-pink",
    avatar: "badge-pink",
    item: "text-[var(--primary)]",
    icon: <ShieldCheck className="w-3 h-3" />,
  },
  Staff: {
    badge: "badge-blue",
    avatar: "badge-blue",
    item: "text-[var(--accent-blue-text)]",
    icon: <BadgeCheck className="w-3 h-3" />,
  },
  User: {
    badge: "badge-green",
    avatar: "badge-green",
    item: "text-[var(--accent-green-text)]",
    icon: <User className="w-3 h-3" />,
  },
  Customer: {
    badge: "badge-orange",
    avatar: "badge-orange",
    item: "text-[var(--accent-orange-text)]",
    icon: <ShoppingBag className="w-3 h-3" />,
  },
};

const STATUS_STYLE: Record<string, { badge: string; dotColor: string; item: string }> = {
  ACTIVE: {
    badge: "badge-green",
    dotColor: "var(--accent-green-text)",
    item: "text-[var(--accent-green-text)]",
  },
  INACTIVE: {
    badge: "badge-red",
    dotColor: "var(--accent-red-text)",
    item: "text-[var(--accent-red-text)]",
  },
  LOCKED: {
    badge: "badge-gray",
    dotColor: "var(--accent-gray-text)",
    item: "text-[var(--accent-gray-text)]",
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
    <span className={`badge ${s.badge}`}>
      {s.icon}
      {roleName}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = getStatusStyle(status);
  return (
    <span className={`badge ${s.badge}`}>
      <span
        className="led-dot"
        style={{ backgroundColor: s.dotColor, color: s.dotColor }}
      />
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
  options: { value: string; label: string; dotColor?: string }[];
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
        className={`admin-filter-trigger${open ? " is-open" : ""} w-full flex items-center justify-between px-4 py-3 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 ${
          open ? "ring-2 ring-primary/20" : ""
        }`}
      >
        <span className="flex items-center gap-2">
          {selected.dotColor && (
            <span
              className="led-dot"
              style={{ backgroundColor: selected.dotColor, color: selected.dotColor }}
            />
          )}
          <span style={{ color: value === "all" || !value ? "var(--foreground-muted)" : "var(--foreground)" }}>
            {selected.label}
          </span>
        </span>
        <ChevronDown
          className="w-4 h-4 transition-transform duration-200"
          style={{ color: "var(--foreground-muted)", transform: open ? "rotate(180deg)" : undefined }}
        />
      </button>

      {open && typeof document !== "undefined" && createPortal(
        <div
          ref={menuRef}
          style={{ position: "fixed", top: coords.top, left: coords.left, width: coords.width, zIndex: 9999 }}
          className="glass-panel overflow-hidden py-1"
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              style={{ color: opt.value === value ? "var(--foreground)" : "var(--foreground-muted)", fontWeight: opt.value === value ? 500 : 400 }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--dropdown-hover-bg)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors"
            >
              {opt.dotColor && (
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: opt.dotColor }}
                />
              )}
              <span className="flex-1 text-left">{opt.label}</span>
              {opt.value === value && <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--primary)" }} />}
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
          className={`badge badge-trigger inline-flex items-center gap-1.5 pl-2.5 pr-2 py-0.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 ${selected.badgeClass}`}
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
          className="glass-panel overflow-hidden py-1"
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--dropdown-hover-bg)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs font-medium transition-colors ${opt.itemClass}`}
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
      prefix: (
        <span
          className="led-dot"
          style={{ backgroundColor: s.dotColor, color: s.dotColor }}
        />
      ),
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
      <div className="admin-dialog-overlay" onClick={onClose}>
        <div
          className="admin-dialog-content w-full max-w-sm"
          onClick={(e) => e.stopPropagation()}
        >
        <div className="relative admin-dialog-header">
          <button
            onClick={onClose}
            style={{ color: "var(--foreground-muted)" }}
            className="admin-action-btn absolute top-4 right-4"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-4">
            <UserAvatar name={user.fullName || ""} roleName={roleName} />
            <div className="min-w-0">
              <p className="font-semibold text-base leading-tight truncate">{user.fullName}</p>
              <p className="text-xs mt-0.5 truncate" style={{ color: "var(--foreground-muted)" }}>@{user.username}</p>
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                <RoleBadge roleName={roleName} />
                <StatusBadge status={user.status ?? "ACTIVE"} />
              </div>
            </div>
          </div>
        </div>

        <div className="admin-dialog-body">
          <p className="text-[10px] font-medium uppercase tracking-widest" style={{ color: "var(--foreground-muted)" }}>
            Account info
          </p>
          <div
            className="text-xs font-mono rounded-lg px-3 py-2 truncate"
            style={{ color: "var(--foreground-muted)", background: "var(--chip-bg)", border: "1px solid var(--chip-border)" }}
          >
            ID: {user.userId}
          </div>
          {detailRows.map((row) => (
            <div key={row.label} className="flex items-start gap-3 py-1.5 border-b last:border-0" style={{ borderColor: "var(--border-subtle)" }}>
              <span className="mt-0.5 flex-shrink-0" style={{ color: "var(--foreground-muted)" }}>{row.icon}</span>
              <span className="text-xs w-24 flex-shrink-0" style={{ color: "var(--foreground-muted)" }}>{row.label}</span>
              <span className="text-xs font-medium text-right flex-1 break-all">{row.value}</span>
            </div>
          ))}
        </div>

        <div className="admin-dialog-footer !justify-stretch">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-lg btn-glass-destructive"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete confirmation modal ────────────────────────────────────────────────

function DeleteUserModal({
  user,
  loading,
  onCancel,
  onConfirm,
}: {
  user: ApiUser;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="admin-dialog-overlay" onClick={onCancel}>
      <div
        className="admin-dialog-content max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="admin-dialog-header">
          <h3 className="text-base font-semibold">Soft delete user?</h3>
        </div>
        <div className="admin-dialog-body">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">{user.fullName}</strong> will be set to{" "}
            <span className="font-medium text-[var(--accent-red-text)]">INACTIVE</span>.
            They can be reactivated later from this page.
          </p>
        </div>
        <div className="admin-dialog-footer">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="btn-modal-cancel"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="btn-modal-destructive"
          >
            {loading ? "Deleting…" : (<><Trash2 className="w-4 h-4" />Delete</>)}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Update User Modal ────────────────────────────────────────────────────────

function UpdateUserModal({
  user,
  loading,
  onCancel,
  onConfirm,
}: {
  user: ApiUser;
  loading: boolean;
  onCancel: () => void;
  onConfirm: (data: {
    username?: string;
    email?: string;
    fullName?: string;
    phone?: string;
    address?: string;
    gender?: "MALE" | "FEMALE" | "OTHER";
    dateOfBirth?: string;
    subscription?: string;
  }) => void;
}) {
  const [formData, setFormData] = useState({
    username: user.username || "",
    email: user.email || "",
    fullName: user.fullName || "",
    phone: user.phone || "",
    address: user.address || "",
    gender: user.gender || "OTHER",
    dateOfBirth: user.dateOfBirth || "",
    subscription: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({
      ...formData,
      subscription: formData.subscription || undefined,
    });
  };

  return (
    <div className="admin-dialog-overlay" onClick={onCancel}>
      <div
        className="admin-dialog-content max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="admin-dialog-header">
          <h3 className="text-base font-semibold">Update User</h3>
          <button
            onClick={onCancel}
            style={{ color: "var(--foreground-muted)" }}
            className="admin-action-btn absolute top-4 right-4"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="admin-dialog-body space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--foreground-muted)" }}>
                  Username *
                </label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--foreground-muted)" }}>
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--foreground-muted)" }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--foreground-muted)" }}>
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="input w-full"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--foreground-muted)" }}>
                  Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--foreground-muted)" }}>
                  Gender
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as "MALE" | "FEMALE" | "OTHER" })}
                  className="input w-full"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--foreground-muted)" }}>
                  Date of Birth
                </label>
                <input
                  type="text"
                  placeholder="MM/DD/YYYY"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className="input w-full"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--foreground-muted)" }}>
                  Subscription
                </label>
                <input
                  type="text"
                  placeholder="e.g., Freemium, Premium"
                  value={formData.subscription}
                  onChange={(e) => setFormData({ ...formData, subscription: e.target.value })}
                  className="input w-full"
                />
              </div>
            </div>
          </div>
          <div className="admin-dialog-footer">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="btn-modal-cancel"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-modal-primary"
            >
              {loading ? "Updating…" : (<><Edit3 className="w-4 h-4" />Update User</>)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Create User Modal ────────────────────────────────────────────────────────

function CreateUserModal({
  loading,
  onCancel,
  onConfirm,
}: {
  loading: boolean;
  onCancel: () => void;
  onConfirm: (data: {
    username: string;
    email: string;
    password: string;
    fullName: string;
    phone: string;
    address?: string;
    gender?: "MALE" | "FEMALE" | "OTHER";
    dateOfBirth?: string;
    roleId: string;
  }) => void;
}) {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    fullName: "",
    phone: "",
    address: "",
    gender: "OTHER" as "MALE" | "FEMALE" | "OTHER",
    dateOfBirth: "",
    roleId: "6a250549d5316cfeb83101c2", // Default to Customer
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(formData);
  };

  return (
    <div className="admin-dialog-overlay" onClick={onCancel}>
      <div
        className="admin-dialog-content max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="admin-dialog-header">
          <h3 className="text-base font-semibold">Create New User</h3>
          <button
            onClick={onCancel}
            style={{ color: "var(--foreground-muted)" }}
            className="admin-action-btn absolute top-4 right-4"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="admin-dialog-body space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--foreground-muted)" }}>
                  Username *
                </label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--foreground-muted)" }}>
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--foreground-muted)" }}>
                  Password *
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--foreground-muted)" }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--foreground-muted)" }}>
                  Phone *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--foreground-muted)" }}>
                  Role *
                </label>
                <select
                  value={formData.roleId}
                  onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                  className="input w-full"
                >
                  {ROLE_OPTIONS.filter(r => r.name !== "Admin").map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--foreground-muted)" }}>
                  Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--foreground-muted)" }}>
                  Gender
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as "MALE" | "FEMALE" | "OTHER" })}
                  className="input w-full"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--foreground-muted)" }}>
                  Date of Birth
                </label>
                <input
                  type="text"
                  placeholder="MM/DD/YYYY"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className="input w-full"
                />
              </div>
            </div>
          </div>
          <div className="admin-dialog-footer">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="btn-modal-cancel"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-modal-primary"
            >
              {loading ? "Creating…" : (<><Plus className="w-4 h-4" />Create User</>)}
            </button>
          </div>
        </form>
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
  const [userToDelete, setUserToDelete] = useState<ApiUser | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [stats, setStats] = useState<UserStatistics | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Update & Create modals
  const [userToUpdate, setUserToUpdate] = useState<ApiUser | null>(null);
  const [updating, setUpdating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);

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

  const requestDeleteUser = (user: ApiUser) => {
    if (!isAdmin) return;
    setUserToDelete(user);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    const user = userToDelete;
    try {
      setDeleting(true);
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
      setUserToDelete(null);
    } catch {
      toast.error("Failed to delete user");
    } finally {
      setDeleting(false);
    }
  };

  const handleUpdateUser = async (userId: string, data: {
    username?: string;
    email?: string;
    fullName?: string;
    phone?: string;
    address?: string;
    gender?: "MALE" | "FEMALE" | "OTHER";
    dateOfBirth?: string;
    subscription?: string;
  }) => {
    if (!isAdmin) return;
    try {
      setUpdating(true);
      const { data: response } = await userService.adminUpdateUser(userId, data);
      const updatedUser = response.data.updatedResult;
      setUsers((prev) =>
        prev.map((u) => (u.userId === userId ? { ...u, ...updatedUser } : u)),
      );
      logActivity({
        type: "user_created",
        userId: "admin",
        userName: "Admin",
        description: `Updated user: ${updatedUser.fullName || userId}`,
      });
      toast.success("User updated successfully");
      setUserToUpdate(null);
    } catch {
      toast.error("Failed to update user");
    } finally {
      setUpdating(false);
    }
  };

  const handleCreateUser = async (data: {
    username: string;
    email: string;
    password: string;
    fullName: string;
    phone: string;
    address?: string;
    gender?: "MALE" | "FEMALE" | "OTHER";
    dateOfBirth?: string;
    roleId: string;
  }) => {
    if (!isAdmin) return;
    try {
      setCreating(true);
      await authService.adminRegister(data);
      logActivity({
        type: "user_created",
        userId: "admin",
        userName: "Admin",
        description: `Created new user: ${data.fullName} (${data.username})`,
      });
      toast.success("User created successfully");
      setShowCreateModal(false);
      loadUsers();
    } catch {
      toast.error("Failed to create user");
    } finally {
      setCreating(false);
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
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="mb-2">User Management</h1>
          <p className="text-muted-foreground">
            {isAdmin ? "Manage users, statuses, and roles" : "View registered users"}
          </p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowCreateModal(true)} className="btn-create">
            <Plus size={18} />
            +create
          </button>
        )}
      </div>

      {/* User Statistics */}
      <div
        className="admin-panel-glow rounded-2xl border p-6 transition-all duration-300 hover:shadow-lg"
        style={{ background: "var(--card)", borderColor: "var(--border-light)" }}
      >
        <div className="flex items-center gap-2 mb-4">
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
              {/* Total */}
              <div
                className="group relative overflow-hidden rounded-xl border p-3 transition-all duration-300 hover:shadow-md hover:scale-[1.02]"
                style={{ background: "var(--primary-light)", borderColor: "var(--primary-soft)" }}
              >
                <div className="relative z-10">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span
                      className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                      style={{ background: "var(--primary-soft)", color: "var(--primary)" }}
                    >
                      <Users className="w-3 h-3" />
                    </span>
                    <span className="text-[10px] font-medium uppercase tracking-wide" style={{ color: "var(--primary)" }}>
                      Total
                    </span>
                  </div>
                  <p className="text-lg font-bold" style={{ color: "var(--foreground)" }}>{stats.totalUsers}</p>
                </div>
              </div>

              {/* Active */}
              <div
                className="group relative overflow-hidden rounded-xl border p-3 transition-all duration-300 hover:shadow-md hover:scale-[1.02]"
                style={{ background: "var(--accent-green)", borderColor: "var(--accent-green-text)" }}
              >
                <div className="relative z-10">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span
                      className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                      style={{ background: "var(--card)", color: "var(--accent-green-text)" }}
                    >
                      <UserCheck className="w-3 h-3" />
                    </span>
                    <span className="text-[10px] font-medium uppercase tracking-wide" style={{ color: "var(--accent-green-text)" }}>
                      Active
                    </span>
                  </div>
                  <p className="text-lg font-bold" style={{ color: "var(--accent-green-text)" }}>{stats.activeUsers}</p>
                </div>
              </div>

              {/* Inactive */}
              <div
                className="group relative overflow-hidden rounded-xl border p-3 transition-all duration-300 hover:shadow-md hover:scale-[1.02]"
                style={{ background: "var(--accent-red)", borderColor: "var(--accent-red-text)" }}
              >
                <div className="relative z-10">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span
                      className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                      style={{ background: "var(--card)", color: "var(--accent-red-text)" }}
                    >
                      <UserX className="w-3 h-3" />
                    </span>
                    <span className="text-[10px] font-medium uppercase tracking-wide" style={{ color: "var(--accent-red-text)" }}>
                      Inactive
                    </span>
                  </div>
                  <p className="text-lg font-bold" style={{ color: "var(--accent-red-text)" }}>{stats.inactiveUsers}</p>
                </div>
              </div>

              {/* Locked */}
              <div
                className="group relative overflow-hidden rounded-xl border p-3 transition-all duration-300 hover:shadow-md hover:scale-[1.02]"
                style={{ background: "var(--accent-orange)", borderColor: "var(--accent-orange-text)" }}
              >
                <div className="relative z-10">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span
                      className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                      style={{ background: "var(--card)", color: "var(--accent-orange-text)" }}
                    >
                      <Lock className="w-3 h-3" />
                    </span>
                    <span className="text-[10px] font-medium uppercase tracking-wide" style={{ color: "var(--accent-orange-text)" }}>
                      Locked
                    </span>
                  </div>
                  <p className="text-lg font-bold" style={{ color: "var(--accent-orange-text)" }}>{stats.lockedUsers}</p>
                </div>
              </div>
            </div>
            {stats.usersByRole.length > 0 && (
              <div className="flex flex-wrap items-center gap-3 pt-3 border-t" style={{ borderColor: "var(--border-subtle)" }}>
                <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "var(--foreground-muted)" }}>By Role:</span>
                {stats.usersByRole.map((r) => (
                  <span
                    key={r.roleName}
                    className="text-xs px-2.5 py-1 rounded-full"
                    style={{ background: "var(--chip-bg)", border: "1px solid var(--chip-border)", color: "var(--foreground-muted)" }}
                  >
                    {r.roleName}: <strong style={{ color: "var(--foreground)" }}>{r.count}</strong>
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

      {/* Filters and Table */}
      <div className="admin-panel-glow rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-lg" style={{ borderColor: "var(--border)" }}>
        {/* Filters */}
        <div className="p-6 border-b border-border space-y-3" style={{ background: "var(--surface)" }}>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input w-full"
              style={{ paddingLeft: "3rem", paddingRight: "1rem", paddingTop: "0.75rem", paddingBottom: "0.75rem" }}
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <FilterSelect
              value={statusFilter}
              options={[
                { value: "all", label: "All statuses" },
                { value: "ACTIVE", label: "ACTIVE", dotColor: "var(--accent-green-text)" },
                { value: "INACTIVE", label: "INACTIVE", dotColor: "var(--accent-red-text)" },
                { value: "LOCKED", label: "LOCKED", dotColor: "var(--accent-gray-text)" },
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
        <div className="overflow-x-auto" style={{ background: "var(--card)" }}>
          <table className="admin-table w-full">
            <thead className="bg-muted">
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
                    <tr key={user.userId} className="border-b border-border hover:bg-[var(--surface-secondary)] transition-colors">
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
                               className="admin-action-btn view"
                               title="View detail"
                             >
                               <Eye className="w-4 h-4" />
                             </button>
                             <button
                               onClick={() => setUserToUpdate(user)}
                               className="admin-action-btn edit"
                               title="Update user"
                             >
                               <Edit3 className="w-4 h-4" />
                             </button>
                             <button
                               onClick={() => requestDeleteUser(user)}
                               className="admin-action-btn delete"
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

      {userToDelete && (
        <DeleteUserModal
          user={userToDelete}
          loading={deleting}
          onCancel={() => setUserToDelete(null)}
          onConfirm={confirmDeleteUser}
        />
      )}

      {userToUpdate && (
        <UpdateUserModal
          user={userToUpdate}
          loading={updating}
          onCancel={() => setUserToUpdate(null)}
          onConfirm={(data) => handleUpdateUser(userToUpdate.userId, data)}
        />
      )}

      {showCreateModal && (
        <CreateUserModal
          loading={creating}
          onCancel={() => setShowCreateModal(false)}
          onConfirm={handleCreateUser}
        />
      )}
    </div>
  );
}