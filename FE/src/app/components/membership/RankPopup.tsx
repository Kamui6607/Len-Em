import { motion, AnimatePresence } from "motion/react";
import type { RankType } from "../../../features/membership/types/membership.types";
import { getRankConfig } from "../../../features/membership/types/membership.types";
import { BenefitCard } from "./BenefitCard";

interface RankPopupProps {
  show: boolean;
  oldRank: RankType | null;
  newRank: RankType;
  onDismiss: () => void;
  onExplore: () => void;
}

export function RankPopup({ show, oldRank, newRank, onDismiss, onExplore }: RankPopupProps) {
  const newConfig = getRankConfig(newRank);
  const newBenefits = newConfig.benefits.filter(
    (b) => b.unlockedAtRank === newRank,
  );

  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onDismiss}
          />

          <motion.div
            className="fixed inset-4 z-[101] flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", damping: 20, stiffness: 200 }}
          >
            <div className="bg-card rounded-3xl border border-border shadow-2xl max-w-md w-full pointer-events-auto overflow-hidden">
              <div className="relative p-8 text-center overflow-hidden" style={{ background: newConfig.gradient }}>
                <motion.div
                  className="text-7xl mb-3"
                  initial={{ rotate: -20, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: "spring", damping: 10, stiffness: 150, delay: 0.2 }}
                >
                  {newConfig.icon}
                </motion.div>

                <motion.h2
                  className="text-2xl font-bold mb-1"
                  style={{ color: newConfig.textColor }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  Congratulations!
                </motion.h2>

                {oldRank && (
                  <motion.p
                    className="text-sm opacity-70 font-medium"
                    style={{ color: newConfig.textColor }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    {getRankConfig(oldRank).icon} {getRankConfig(oldRank).displayName}
                    {" → "}
                    {newConfig.icon} <strong>{newConfig.displayName}</strong>
                  </motion.p>
                )}
              </div>

              <div className="p-6 space-y-4">
                <motion.p
                  className="text-center text-sm font-medium"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  You've reached <strong style={{ color: newConfig.textColor }}>{newConfig.displayName}</strong>! 🎉
                </motion.p>

                {newBenefits.length > 0 && (
                  <motion.div
                    className="space-y-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                  >
                    <p className="text-xs font-medium text-muted-foreground">New perks unlocked:</p>
                    {newBenefits.map((benefit) => (
                      <BenefitCard key={benefit.id} benefit={benefit} currentRank={newRank} compact />
                    ))}
                  </motion.div>
                )}

                <motion.div
                  className="space-y-2 pt-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.9 }}
                >
                  <button
                    onClick={onExplore}
                    className="w-full py-3 rounded-full font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm"
                    style={{ background: newConfig.gradient, color: newConfig.textColor }}
                  >
                    Explore my benefits
                  </button>
                  <button
                    onClick={onDismiss}
                    className="w-full py-3 rounded-full font-medium text-sm text-muted-foreground hover:bg-muted transition-colors"
                  >
                    Maybe later
                  </button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}