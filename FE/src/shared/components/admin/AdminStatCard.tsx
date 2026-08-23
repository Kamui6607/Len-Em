import { TrendingUp, TrendingDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export interface AdminStatCardData {
  title: string;
  value: ReactNode;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  meta?: string;
  metaTone?: "up" | "down" | "neutral";
}

const META_COLOR: Record<NonNullable<AdminStatCardData["metaTone"]>, string> = {
  up: "var(--success-text)",
  down: "var(--destructive)",
  neutral: "var(--foreground-muted)",
};

/**
 * A single dashboard stat tile. Extracted from AdminDashboard's inline
 * `stats.map(...)` block so the same card can be reused by any future
 * summary row (e.g. a per-page "N items / N published" strip) without
 * copy-pasting the markup again.
 */
export function AdminStatCard({ stat, loading }: { stat: AdminStatCardData; loading?: boolean }) {
  const Icon = stat.icon;
  return (
    <div
      className="admin-panel-glow admin-stat-card rounded-2xl border p-5 transition-all duration-300"
      style={{ background: "var(--card)", borderColor: "var(--border)" }}
    >
      <div className="flex items-center justify-between mb-4">
        <div
          className="admin-stat-icon w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: stat.iconBg, color: stat.iconColor }}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
      <h3 className="admin-stat-value text-2xl font-bold text-foreground mb-2">
        {loading ? <span className="admin-skeleton inline-block h-7 w-16 rounded-md" /> : stat.value}
      </h3>
      {stat.meta && !loading && (
        <p className="flex items-center gap-1 text-xs font-medium" style={{ color: META_COLOR[stat.metaTone ?? "neutral"] }}>
          {stat.metaTone === "up" && <TrendingUp className="w-3.5 h-3.5" />}
          {stat.metaTone === "down" && <TrendingDown className="w-3.5 h-3.5" />}
          {stat.meta}
        </p>
      )}
    </div>
  );
}

/** Responsive grid the stat cards sit in. */
export function AdminStatGrid({ children }: { children: ReactNode }) {
  return <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">{children}</div>;
}
