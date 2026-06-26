import { useNavigate } from "react-router";
import { useAuth } from "../../../hooks/useAuth";
import { useMembershipStore } from "../../../features/membership/store/membership.store";
import { getRankConfig, getNextRank } from "../../../features/membership/types/membership.types";
import { formatPrice } from "../../../lib/formatPrice";
import { RankBadge } from "./RankBadge";
import { ProgressBar } from "./ProgressBar";

interface MembershipCardProps {
  compact?: boolean;
  onViewHistory?: () => void;
  onViewBenefits?: () => void;
  onViewTimeline?: () => void;
}

export function MembershipCard({
  compact = false,
  onViewHistory,
  onViewBenefits,
  onViewTimeline,
}: MembershipCardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, loading } = useMembershipStore();

  if (loading || !data || !user) {
    return (
      <div className="bg-card rounded-2xl border border-border p-5 animate-pulse">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-muted" />
          <div className="space-y-2">
            <div className="h-4 w-24 bg-muted rounded" />
            <div className="h-3 w-16 bg-muted rounded" />
          </div>
        </div>
        <div className="h-3 bg-muted rounded w-full mb-2" />
        <div className="h-3 bg-muted rounded w-3/4" />
      </div>
    );
  }

  const config = getRankConfig(data.rank);
  const nextRankInfo = getNextRank(data.rank, data.points);

  return (
    <div
      className="rounded-2xl border border-border overflow-hidden transition-all duration-300 hover:shadow-lg group"
      style={{ background: config.gradient }}
    >
      {/* Card Header */}
      <div className="p-5 pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.fullName}
                className="w-11 h-11 rounded-full border-2 border-white/40 object-cover"
              />
            ) : (
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center text-lg font-bold shadow-sm"
                style={{ background: "rgba(255,255,255,0.25)", color: config.textColor }}
              >
                {user.fullName?.charAt(0)?.toUpperCase() ?? "U"}
              </div>
            )}
            <div>
              <p className="font-bold text-sm leading-tight" style={{ color: config.textColor }}>
                {user.fullName}
              </p>
              <RankBadge rank={data.rank} size="sm" showLabel />
            </div>
          </div>
          {!compact && (
            <div className="text-right">
              <p className="text-[10px] font-medium uppercase tracking-wider opacity-60" style={{ color: config.textColor }}>
                Points
              </p>
              <p className="text-sm font-bold" style={{ color: config.textColor }}>
                {data.points.toLocaleString()}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Progress Section */}
      <div className="px-5 pb-3">
        <ProgressBar
          points={data.points}
          currentRank={data.rank}
          size={compact ? "sm" : "md"}
        />
      </div>

      {/* Coin & Total Spent */}
      <div className="px-5 pb-4">
        <div className="grid grid-cols-2 gap-2.5">
          <div
            className="rounded-xl p-3 backdrop-blur-sm"
            style={{ background: "rgba(255,255,255,0.2)" }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-xs">🪙</span>
              <p className="text-[9px] font-medium uppercase tracking-wider opacity-70" style={{ color: config.textColor }}>
                Coin
              </p>
            </div>
            <p className="text-sm font-bold" style={{ color: config.textColor }}>
              {data.coinBalance.toLocaleString()}
            </p>
            <p className="text-[9px] opacity-60" style={{ color: config.textColor }}>
              ≈ {formatPrice(data.coinBalance)}
            </p>
          </div>
          <div
            className="rounded-xl p-3 backdrop-blur-sm"
            style={{ background: "rgba(255,255,255,0.2)" }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-xs">💰</span>
              <p className="text-[9px] font-medium uppercase tracking-wider opacity-70" style={{ color: config.textColor }}>
                Đã chi
              </p>
            </div>
            <p className="text-sm font-bold" style={{ color: config.textColor }}>
              {formatPrice(data.totalSpent)}
            </p>
          </div>
        </div>
      </div>

      {/* Next Rank Info */}
      {nextRankInfo.nextRank && !compact && (
        <div className="px-5 pb-3">
          <div
            className="rounded-xl p-3 backdrop-blur-sm flex items-center justify-between"
            style={{ background: "rgba(0,0,0,0.05)" }}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">🔒</span>
              <div>
                <p className="text-[10px] opacity-70" style={{ color: config.textColor }}>
                  Hạng tiếp theo
                </p>
                <p className="text-xs font-semibold" style={{ color: config.textColor }}>
                  {getRankConfig(nextRankInfo.nextRank).icon} {getRankConfig(nextRankInfo.nextRank).displayName}
                </p>
              </div>
            </div>
            <p className="text-[10px] text-right" style={{ color: config.textColor }}>
              <span className="opacity-70">Còn </span>
              <span className="font-bold">{formatPrice(nextRankInfo.pointsNeeded * 1000)}</span>
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      {!compact && (
        <div
          className="flex border-t"
          style={{ borderColor: "rgba(0,0,0,0.08)" }}
        >
          <button
            onClick={onViewHistory ?? (() => navigate("/my-account/membership"))}
            className="flex-1 py-3 text-xs font-medium text-center hover:bg-black/5 active:bg-black/10 transition-colors min-h-[44px]"
            style={{ color: config.textColor }}
          >
            📋 History
          </button>
          <button
            onClick={onViewBenefits ?? (() => navigate("/my-account/membership?tab=benefits"))}
            className="flex-1 py-3 text-xs font-medium text-center hover:bg-black/5 active:bg-black/10 transition-colors border-x min-h-[44px]"
            style={{ color: config.textColor, borderColor: "rgba(0,0,0,0.08)" }}
          >
            🎁 Benefits
          </button>
          <button
            onClick={onViewTimeline ?? (() => navigate("/my-account/membership?tab=timeline"))}
            className="flex-1 py-3 text-xs font-medium text-center hover:bg-black/5 active:bg-black/10 transition-colors min-h-[44px]"
            style={{ color: config.textColor }}
          >
            📈 Timeline
          </button>
        </div>
      )}
    </div>
  );
}