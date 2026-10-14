import type { CSSProperties } from "react";
import { Check } from "lucide-react";
import type { RankType } from "../../../features/membership/types/membership.types";
import { getRankConfig, rankIndex, RANK_ORDER } from "../../../features/membership/types/membership.types";
import "../../../styles/membership.css";

interface RankJourneyProps {
  currentRank: RankType;
  points: number;
}

/**
 * Hành trình hạng — các nút thắt trên một sợi chỉ (ngang trên desktop,
 * dọc trên mobile). Đoạn chỉ sau hạng hiện tại được "may" tới đúng tiến độ.
 */
export function RankJourney({ currentRank, points }: RankJourneyProps) {
  const currentIndex = rankIndex(currentRank);

  return (
    <ol className="mb-journey">
      {RANK_ORDER.map((rank, index) => {
        const config = getRankConfig(rank);
        const state = index < currentIndex ? "done" : index === currentIndex ? "current" : "todo";
        const nextConfig = index < RANK_ORDER.length - 1 ? getRankConfig(RANK_ORDER[index + 1]) : null;

        // Độ dài đoạn chỉ nối tới hạng kế tiếp: đã qua = đầy, đang ở = theo điểm.
        let fill = 0;
        if (nextConfig && index < currentIndex) fill = 1;
        if (nextConfig && index === currentIndex) {
          const range = Math.max(1, nextConfig.minPoints - config.minPoints);
          fill = Math.min(1, Math.max(0, (points - config.minPoints) / range));
        }

        return (
          <li
            key={rank}
            className="mb-stop"
            data-rank={rank}
            data-state={state}
            style={{ "--fill": fill } as CSSProperties}
            aria-current={state === "current" ? "step" : undefined}
          >
            <span className="mb-knot" aria-hidden="true">
              {config.icon}
              {state === "done" && (
                <span className="mb-knot-check">
                  <Check size={12} strokeWidth={3} />
                </span>
              )}
            </span>
            <div>
              <p className="mb-stop-name">
                {config.displayName}
                {state === "current" && <span className="mb-stop-flag">Hạng của bạn</span>}
                {index === currentIndex + 1 && <span className="mb-stop-flag is-next">Kế tiếp</span>}
              </p>
              <p className="mb-stop-meta">
                {config.minPoints > 0 ? `Từ ${config.minPoints.toLocaleString("vi-VN")} điểm` : "Khi tham gia"}
                {" · "}hoàn {config.coinRewardPercent}% Coin
              </p>
              {state === "current" && (
                <p className="mb-stop-note">bạn đang ở đây · {points.toLocaleString("vi-VN")} điểm</p>
              )}
              {index === currentIndex + 1 && (
                <p className="mb-stop-note">còn {Math.max(0, config.minPoints - points).toLocaleString("vi-VN")} điểm nữa</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
