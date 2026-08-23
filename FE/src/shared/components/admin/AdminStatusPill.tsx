type Tone = "success" | "warning" | "error" | "info" | "neutral";

const TONE_VARS: Record<Tone, { bg: string; text: string; border: string; dot: string }> = {
  success: { bg: "var(--success-bg)", text: "var(--success-text)", border: "var(--success-border)", dot: "var(--success-text)" },
  warning: { bg: "var(--warning-bg)", text: "var(--warning-text)", border: "var(--warning-border)", dot: "var(--warning-text)" },
  error: { bg: "var(--error-bg)", text: "var(--error-text)", border: "var(--error-border)", dot: "var(--error-text)" },
  info: { bg: "var(--info-bg)", text: "var(--info-text)", border: "var(--info-border)", dot: "var(--info-text)" },
  neutral: { bg: "var(--muted)", text: "var(--foreground-muted)", border: "var(--border)", dot: "var(--foreground-muted)" },
};

interface AdminStatusPillProps {
  label: string;
  tone: Tone;
  withDot?: boolean;
}

/**
 * Pill for status flags (active/inactive, published/draft, etc.) built on
 * the same `--success-*` / `--error-*` / `--warning-*` tokens the rest of
 * admin already uses (see AdminCourses' level badges).
 *
 * Replaces the ad hoc, theme-unaware version previously duplicated in
 * ProductDetail and RoleDetail:
 *   className={isActive
 *     ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
 *     : "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-400"}
 * That hardcoded emerald/rose and only had one hand-written dark variant,
 * so it never matched the app's actual light/dark theme tokens.
 */
export function AdminStatusPill({ label, tone, withDot = true }: AdminStatusPillProps) {
  const v = TONE_VARS[tone];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border"
      style={{ background: v.bg, color: v.text, borderColor: v.border }}
    >
      {withDot && <span className="w-1.5 h-1.5 rounded-full" style={{ background: v.dot }} />}
      {label}
    </span>
  );
}

/** Convenience wrapper for the common isActive/isPublished boolean case. */
export function AdminActivePill({ active, activeLabel, inactiveLabel }: { active: boolean; activeLabel: string; inactiveLabel: string }) {
  return <AdminStatusPill label={active ? activeLabel : inactiveLabel} tone={active ? "success" : "error"} />;
}
