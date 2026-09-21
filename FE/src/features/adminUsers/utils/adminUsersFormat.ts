// ============================================================
// Shared display helpers for the admin users screens
// (badge colours, avatar initials, labels, date formatting).
// ============================================================

/** Badge colour for a role name (Admin = red, Staff = green, Customer = blue). */
export function getRoleBadgeClass(roleName: string): string {
  const lower = (roleName || "").toLowerCase().trim();
  if (lower.includes("admin") || lower.includes("quản trị")) return "badge-red";
  if (lower.includes("staff") || lower.includes("nhân viên")) return "badge-green";
  if (lower.includes("customer") || lower.includes("khách")) return "badge-blue";
  return "badge-gray";
}

/** Badge colour for a user status. */
export function getStatusBadgeClass(status?: string | null): string {
  const upper = (status ?? "").toUpperCase().trim();
  if (upper === "ACTIVE") return "badge-green";
  if (upper === "INACTIVE" || upper === "LOCKED") return "badge-red";
  return "badge-gray";
}

/** Localized label for a status ("ACTIVE" → "Đang hoạt động"). */
export function statusLabel(status: string | undefined, t: (key: string) => string): string {
  if (status === "ACTIVE") return t("admin.users.active");
  if (status === "INACTIVE") return t("admin.users.inactive");
  if (status === "LOCKED") return t("admin.users.locked");
  return status ?? "ACTIVE";
}

/** Initials for the avatar chip ("Nguyen Van A" → "NA"). */
export function initialsOf(name: string): string {
  return (name || "")
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Date of birth (ISO or plain) → dd/mm/yyyy; returns the raw value if unparsable. */
export function formatDateOfBirth(value?: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("vi-VN");
}
