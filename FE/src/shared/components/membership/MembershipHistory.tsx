import { Link } from "react-router";
import { BookOpen, Clapperboard, PartyPopper, ScrollText, ShoppingBag, Trophy, type LucideIcon } from "lucide-react";
import { formatPrice } from "../../../lib/formatPrice";
import type { MembershipHistoryEntry } from "../../../features/membership/types/membership.types";
import { getRankConfig } from "../../../features/membership/types/membership.types";
import "../../../styles/membership.css";

interface MembershipHistoryProps {
  history: MembershipHistoryEntry[];
  /** Chỉ 5 dòng gần nhất (tab Tổng quan). */
  compact?: boolean;
}

const SOURCES: Record<MembershipHistoryEntry["source"], { label: string; icon: LucideIcon }> = {
  purchase: { label: "Mua hàng", icon: ShoppingBag },
  diy_video: { label: "Bài DIY", icon: Clapperboard },
  registration: { label: "Đăng ký", icon: PartyPopper },
  rank_up: { label: "Lên hạng", icon: Trophy },
  course_complete: { label: "Khoá học", icon: BookOpen },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function MembershipHistory({ history, compact = false }: MembershipHistoryProps) {
  if (history.length === 0) {
    return (
      <div className="mb-empty">
        <span className="mb-empty-icon">
          <ScrollText size={22} aria-hidden="true" />
        </span>
        <p className="mb-empty-title">Chưa có điểm nào</p>
        <p className="mb-empty-desc">Mua sắm, đăng bài DIY hay hoàn thành khoá học — điểm sẽ được ghi lại ở đây.</p>
      </div>
    );
  }

  const rows = compact ? history.slice(0, 5) : history;

  return (
    <ul className="mb-entries">
      {rows.map((entry) => {
        const source = SOURCES[entry.source] ?? { label: entry.source, icon: ScrollText };
        const Icon = source.icon;
        // orderId chỉ là id đơn hàng khi source === "purchase" (còn lại là id DIY / khoá học).
        const orderId = entry.source === "purchase" ? entry.orderId : undefined;
        const tone =
          entry.status === "completed" ? (entry.points >= 0 ? "is-plus" : "is-minus") : "is-muted";

        return (
          <li key={entry.id} className="mb-entry" data-status={entry.status}>
            <span className="mb-entry-icon" aria-hidden="true">
              <Icon size={17} />
            </span>
            <div className="min-w-0">
              <p className="mb-entry-title">{entry.description}</p>
              <div className="mb-entry-meta">
                <span>{formatDate(entry.date)}</span>
                <span>· {source.label}</span>
                {orderId && (
                  <Link to={`/purchased/${orderId}`}>#{orderId.slice(-8).toUpperCase()}</Link>
                )}
                {entry.orderAmount != null && !compact && <span>· {formatPrice(entry.orderAmount)}</span>}
                {entry.status === "pending" && <span className="mb-status is-pending">Chờ giao hàng</span>}
                {entry.status === "cancelled" && <span className="mb-status is-cancelled">Đã huỷ</span>}
                {entry.newRank && (
                  <span className="mb-status is-rank">
                    {getRankConfig(entry.newRank).icon} Lên {getRankConfig(entry.newRank).displayName}
                  </span>
                )}
              </div>
            </div>
            <p className={`mb-entry-amount ${tone}`}>
              {entry.points > 0 ? "+" : ""}
              {entry.points.toLocaleString("vi-VN")}
              <small>{entry.status === "pending" ? "chưa cộng" : "điểm"}</small>
            </p>
          </li>
        );
      })}
    </ul>
  );
}
