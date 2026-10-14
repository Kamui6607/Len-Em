import type { RankType } from "../../../features/membership/types/membership.types";
import { getNextRank, getRankConfig, POINT_RULES } from "../../../features/membership/types/membership.types";
import { formatPrice } from "../../../lib/formatPrice";
import "../../../styles/membership.css";

interface ProgressBarProps {
  points: number;
  currentRank: RankType;
  showTooltip?: boolean;
  size?: "sm" | "md";
}

/**
 * Sợi chỉ tiến độ tới hạng kế tiếp. Màu lấy theo [data-rank] gần nhất
 * (thường là thẻ thành viên bao ngoài).
 */
export function ProgressBar({ points, currentRank, showTooltip = true, size = "md" }: ProgressBarProps) {
  const current = getRankConfig(currentRank);
  const next = getNextRank(currentRank, points);

  if (!next.nextRank) {
    return (
      <div className="mb-progress" data-size={size}>
        {showTooltip && (
          <div className="mb-progress-labels">
            <span>{current.icon} {current.displayName}</span>
            <span>Hạng cao nhất</span>
          </div>
        )}
        <div className="mb-progress-track" role="progressbar" aria-valuenow={100} aria-valuemin={0} aria-valuemax={100}>
          <div className="mb-progress-fill" style={{ width: "calc(100% - 2px)" }} />
        </div>
        {showTooltip && <p className="mb-progress-hint">Bạn đã chạm tới hạng cao nhất của Len&amp;em Club ✨</p>}
      </div>
    );
  }

  const nextConfig = getRankConfig(next.nextRank);
  const range = Math.max(1, next.nextRankPoints - next.currentRankPoints);
  const progress = Math.min(100, Math.max(0, ((points - next.currentRankPoints) / range) * 100));

  return (
    <div className="mb-progress" data-size={size}>
      {showTooltip && (
        <div className="mb-progress-labels">
          <span>{current.icon} {current.displayName}</span>
          <span>
            {nextConfig.icon} {nextConfig.displayName} · {next.nextRankPoints.toLocaleString("vi-VN")}
          </span>
        </div>
      )}
      <div
        className="mb-progress-track"
        role="progressbar"
        aria-label={`Tiến độ lên hạng ${nextConfig.displayName}`}
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="mb-progress-fill" style={{ width: `max(8px, calc(${progress}% - 2px))` }} />
      </div>
      {showTooltip && (
        <p className="mb-progress-hint">
          Còn <b>{next.pointsNeeded.toLocaleString("vi-VN")} điểm</b>
          {" "}(≈ {formatPrice(next.pointsNeeded * POINT_RULES.vndPerPoint)} mua sắm) để lên {nextConfig.icon}{" "}
          {nextConfig.displayName}
        </p>
      )}
    </div>
  );
}
