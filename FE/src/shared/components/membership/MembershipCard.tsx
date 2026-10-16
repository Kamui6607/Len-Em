import { useNavigate } from "react-router";
import { Coins, Gift, History, Route, Wallet } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useMembershipStore } from "../../../features/membership/store/membership.store";
import { getRankConfig } from "../../../features/membership/types/membership.types";
import { formatPrice } from "../../../lib/formatPrice";
import { ProgressBar } from "./ProgressBar";
import "../../../styles/craft.css";
import "../../../styles/membership.css";
import { Wordmark } from "../brand/Wordmark";

interface MembershipCardProps {
  compact?: boolean;
  onViewHistory?: () => void;
  onViewBenefits?: () => void;
  onViewTimeline?: () => void;
}

/** Thẻ thành viên Len&em Club — dữ liệu thật từ BE, skeleton khi đang tải. */
export function MembershipCard({
  compact = false,
  onViewHistory,
  onViewBenefits,
  onViewTimeline,
}: MembershipCardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, loading, error, initialize } = useMembershipStore();

  if (!loading && !data && error && user) {
    return (
      <div className="mb-card-error">
        <p>{error}</p>
        <button type="button" onClick={initialize} className="craft-btn-ghost mt-3">
          Thử lại
        </button>
      </div>
    );
  }

  if (loading || !data || !user) {
    return <MembershipCardSkeleton compact={compact} />;
  }

  const config = getRankConfig(data.rank);
  const initial = user.fullName?.trim().charAt(0).toUpperCase() || "U";

  return (
    <article className="mb-card" data-rank={data.rank} data-compact={compact} aria-label="Thẻ thành viên">
      <div className="mb-card-body">
        <div className="mb-card-top">
          <span className="mb-card-brand">
            <Wordmark mono className="h-[22px]" label="Len&em" />
            <small>club</small>
          </span>
          <span className="mb-rank-chip">
            <span aria-hidden="true">{config.icon}</span>
            {config.displayName}
          </span>
        </div>

        <div className="mb-card-holder">
          <span className="mb-card-avatar">
            {user.avatar ? <img src={user.avatar} alt="" /> : initial}
          </span>
          <div className="min-w-0">
            <p className="mb-card-name">{user.fullName}</p>
            <p className="mb-card-tier">
              Thành viên {config.displayName} · hoàn {config.coinRewardPercent}% Coin
            </p>
          </div>
        </div>

        <div className="mb-card-points">
          <span className="mb-card-points-num">{data.points.toLocaleString("vi-VN")}</span>
          <span className="mb-card-points-label">điểm tích luỹ</span>
        </div>

        <div className="mt-3">
          <ProgressBar points={data.points} currentRank={data.rank} size={compact ? "sm" : "md"} />
        </div>

        <div className="mb-card-chips">
          <div className="mb-card-chip">
            <p className="mb-card-chip-label">
              <Coins size={12} aria-hidden="true" /> Coin
            </p>
            <p className="mb-card-chip-value">{data.coinBalance.toLocaleString("vi-VN")}</p>
            <p className="mb-card-chip-sub">≈ {formatPrice(data.coinBalance)}</p>
          </div>
          <div className="mb-card-chip">
            <p className="mb-card-chip-label">
              <Wallet size={12} aria-hidden="true" /> Đã chi
            </p>
            <p className="mb-card-chip-value">{formatPrice(data.totalSpent)}</p>
            <p className="mb-card-chip-sub">đơn đã giao</p>
          </div>
        </div>
      </div>

      {!compact && (
        <nav className="mb-card-actions" aria-label="Thành viên">
          <button
            type="button"
            className="mb-card-action"
            onClick={onViewHistory ?? (() => navigate("/my-account/membership?tab=history"))}
          >
            <History size={15} aria-hidden="true" /> Lịch sử
          </button>
          <button
            type="button"
            className="mb-card-action"
            onClick={onViewBenefits ?? (() => navigate("/my-account/membership?tab=benefits"))}
          >
            <Gift size={15} aria-hidden="true" /> Quyền lợi
          </button>
          <button
            type="button"
            className="mb-card-action"
            onClick={onViewTimeline ?? (() => navigate("/my-account/membership?tab=timeline"))}
          >
            <Route size={15} aria-hidden="true" /> Hành trình
          </button>
        </nav>
      )}
    </article>
  );
}

export function MembershipCardSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className="rounded-[26px] border border-[var(--border)] p-5"
      aria-busy="true"
      aria-label="Đang tải thẻ thành viên"
    >
      <div className="flex items-center justify-between">
        <div className="craft-skeleton h-4 w-24" />
        <div className="craft-skeleton h-6 w-20 rounded-full" />
      </div>
      <div className="mt-5 flex items-center gap-3">
        <div className="craft-skeleton h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <div className="craft-skeleton h-4 w-32" />
          <div className="craft-skeleton h-3 w-24" />
        </div>
      </div>
      <div className="craft-skeleton mt-5 h-9 w-28" />
      <div className="craft-skeleton mt-4 h-2.5 w-full rounded-full" />
      {!compact && (
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <div className="craft-skeleton h-16" />
          <div className="craft-skeleton h-16" />
        </div>
      )}
    </div>
  );
}
