import { useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { ArrowRight, Gift } from "lucide-react";
import type { RankType } from "../../../features/membership/types/membership.types";
import { getRankConfig } from "../../../features/membership/types/membership.types";
import { BenefitCard } from "./BenefitCard";
import "../../../styles/craft.css";
import "../../../styles/membership.css";

interface RankPopupProps {
  show: boolean;
  oldRank: RankType | null;
  newRank: RankType;
  onDismiss: () => void;
  onExplore: () => void;
}

export function RankPopup({ show, oldRank, newRank, onDismiss, onExplore }: RankPopupProps) {
  const reduceMotion = useReducedMotion();
  const newConfig = getRankConfig(newRank);
  const newBenefits = newConfig.benefits.filter((b) => b.unlockedAtRank === newRank);

  // Esc để đóng.
  useEffect(() => {
    if (!show) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onDismiss();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [show, onDismiss]);

  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div
            className="mb-pop-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onDismiss}
          />
          <motion.div
            className="mb-pop-wrap"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 8 }}
            transition={{ type: "spring", damping: 22, stiffness: 240 }}
          >
            <div
              className="mb-pop"
              role="dialog"
              aria-modal="true"
              aria-labelledby="mb-pop-title"
              data-rank={newRank}
            >
              <div className="mb-pop-head">
                <motion.div
                  className="mb-pop-icon"
                  aria-hidden="true"
                  initial={reduceMotion ? false : { rotate: -25, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: "spring", damping: 10, stiffness: 160, delay: 0.15 }}
                >
                  {newConfig.icon}
                </motion.div>
                <span className="mb-pop-eyebrow">Chúc mừng bạn!</span>
                <h2 id="mb-pop-title" className="mb-pop-title">
                  Bạn đã lên hạng {newConfig.displayName}
                </h2>
                {oldRank && (
                  <span className="mb-pop-move">
                    {getRankConfig(oldRank).icon} {getRankConfig(oldRank).displayName}
                    <ArrowRight size={13} aria-hidden="true" />
                    {newConfig.icon} {newConfig.displayName}
                  </span>
                )}
              </div>

              <div className="mb-pop-body">
                <p className="mb-pop-label">Quyền lợi mới mở khoá</p>
                {newBenefits.length > 0 ? (
                  newBenefits.map((benefit) => (
                    <BenefitCard key={benefit.id} benefit={benefit} currentRank={newRank} />
                  ))
                ) : (
                  <p className="text-sm text-[var(--foreground-muted)]">
                    Mỗi đơn hàng giờ được hoàn {newConfig.coinRewardPercent}% Coin.
                  </p>
                )}

                <div className="mb-pop-actions">
                  <button type="button" className="craft-btn" onClick={onExplore}>
                    <Gift size={16} aria-hidden="true" /> Xem quyền lợi của tôi
                  </button>
                  <button type="button" className="craft-btn-ghost" onClick={onDismiss}>
                    Để sau
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
