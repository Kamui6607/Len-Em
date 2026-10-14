import { Check, Lock } from "lucide-react";
import type { Benefit, RankType } from "../../../features/membership/types/membership.types";
import { getRankConfig, rankIndex, RANK_CONFIGS } from "../../../features/membership/types/membership.types";
import "../../../styles/membership.css";

interface BenefitCardProps {
  benefit: Benefit;
  currentRank: RankType;
}

/** Một dòng quyền lợi — khoá mờ đi nếu hạng hiện tại chưa mở. */
export function BenefitCard({ benefit, currentRank }: BenefitCardProps) {
  const locked = rankIndex(currentRank) < rankIndex(benefit.unlockedAtRank);
  const unlockAt = getRankConfig(benefit.unlockedAtRank);

  return (
    <div className="mb-perk" data-locked={locked}>
      <span className="mb-perk-icon" aria-hidden="true">
        {locked ? <Lock size={15} /> : benefit.icon}
      </span>
      <div className="min-w-0">
        <p className="mb-perk-title">{benefit.title}</p>
        <p className="mb-perk-desc">{benefit.description}</p>
        {locked && (
          <p className="mb-perk-lock">
            Mở ở hạng {unlockAt.icon} {unlockAt.displayName}
          </p>
        )}
      </div>
    </div>
  );
}

interface RankLadderProps {
  currentRank: RankType;
  points: number;
}

/** Bốn bậc hạng cạnh nhau: ngưỡng điểm, % hoàn coin và quyền lợi của từng bậc. */
export function RankLadder({ currentRank, points }: RankLadderProps) {
  const currentIndex = rankIndex(currentRank);

  return (
    <div className="mb-ladder">
      {RANK_CONFIGS.map((config, index) => {
        const state = index === currentIndex ? "current" : index < currentIndex ? "done" : "locked";
        const missing = Math.max(0, config.minPoints - points);
        return (
          <section
            key={config.rank}
            className="mb-tier"
            data-rank={config.rank}
            data-state={state}
            aria-label={`Hạng ${config.displayName}`}
          >
            <header className="mb-tier-head">
              {state === "current" && <span className="mb-tier-flag">Hạng của bạn</span>}
              <div className="mb-tier-icon" aria-hidden="true">{config.icon}</div>
              <h3 className="mb-tier-name">{config.displayName}</h3>
              <p className="mb-tier-req">
                {config.minPoints > 0 ? `Từ ${config.minPoints.toLocaleString("vi-VN")} điểm` : "Khi tham gia"}
              </p>
            </header>
            <ul className="mb-tier-list">
              {config.benefits.map((b) => (
                <li key={b.id} className="mb-tier-perk">
                  <span className="mb-tier-perk-icon" aria-hidden="true">{b.icon}</span>
                  <span>
                    {b.title}
                    <small>{b.description}</small>
                  </span>
                </li>
              ))}
            </ul>
            <footer className="mb-tier-foot">
              {state === "locked" ? (
                <>
                  <Lock size={13} aria-hidden="true" /> Còn {missing.toLocaleString("vi-VN")} điểm để mở
                </>
              ) : (
                <>
                  <Check size={14} aria-hidden="true" /> {state === "current" ? "Đang được hưởng" : "Đã vượt qua"}
                </>
              )}
            </footer>
          </section>
        );
      })}
    </div>
  );
}
