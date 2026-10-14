// ============================================================
// Membership & Coin Types
// ============================================================

export type RankType = "member" | "silver" | "gold" | "diamond";

export interface RankConfig {
  rank: RankType;
  displayName: string;
  icon: string;
  minPoints: number;
  coinRewardPercent: number;
  benefits: Benefit[];
  gradient: string;
  textColor: string;
  bgColor: string;
}

export interface Benefit {
  id: string;
  icon: string;
  title: string;
  description: string;
  unlockedAtRank: RankType;
  isLocked: boolean;
}

export interface MembershipData {
  userId: string;
  points: number;
  rank: RankType;
  totalSpent: number;
  coinBalance: number;
  updatedAt: string;
}

export interface MembershipHistoryEntry {
  id: string;
  date: string;
  points: number;
  source: "purchase" | "diy_video" | "registration" | "rank_up" | "course_complete";
  description: string;
  orderId?: string;
  orderAmount?: number;
  newRank?: RankType;
  status: "completed" | "pending" | "cancelled";
}

export interface CoinTransaction {
  id: string;
  date: string;
  amount: number;
  type: "earned" | "used" | "expired";
  description: string;
  orderId?: string;
  expiryDate?: string;
}

// Màu hạng lấy từ token --rk-<hạng>-* trong styles/membership.css (có bản dark).
const rankColors = (rank: RankType) => ({
  gradient: `linear-gradient(135deg, var(--rk-${rank}-a) 0%, var(--rk-${rank}-b) 55%, var(--rk-${rank}-c) 100%)`,
  textColor: `var(--rk-${rank}-ink)`,
  bgColor: `var(--rk-${rank}-a)`,
});

export const RANK_CONFIGS: RankConfig[] = [
  {
    rank: "member",
    displayName: "Member",
    icon: "⭐",
    minPoints: 0,
    coinRewardPercent: 3,
    ...rankColors("member"),
    benefits: [
      { id: "benefit-coin-member", icon: "🪙", title: "Hoàn 3% Coin", description: "Nhận lại 3% giá trị đơn hàng dưới dạng Coin", unlockedAtRank: "member", isLocked: false },
      { id: "benefit-birthday-member", icon: "🎂", title: "Quà sinh nhật", description: "Voucher 50.000₫ trong tháng sinh nhật", unlockedAtRank: "member", isLocked: false },
    ],
  },
  {
    rank: "silver",
    displayName: "Silver",
    icon: "🥈",
    minPoints: 1000,
    coinRewardPercent: 4,
    ...rankColors("silver"),
    benefits: [
      { id: "benefit-coin-silver", icon: "🪙", title: "Hoàn 4% Coin", description: "Nhận lại 4% giá trị đơn hàng dưới dạng Coin", unlockedAtRank: "silver", isLocked: false },
      { id: "benefit-birthday-silver", icon: "🎂", title: "Quà sinh nhật", description: "Voucher 100.000₫ trong tháng sinh nhật", unlockedAtRank: "silver", isLocked: false },
      { id: "benefit-workshop", icon: "🎓", title: "Ưu tiên workshop", description: "Đăng ký workshop sớm hơn Member 24 giờ", unlockedAtRank: "silver", isLocked: false },
    ],
  },
  {
    rank: "gold",
    displayName: "Gold",
    icon: "🥇",
    minPoints: 3000,
    coinRewardPercent: 5,
    ...rankColors("gold"),
    benefits: [
      { id: "benefit-coin-gold", icon: "🪙", title: "Hoàn 5% Coin", description: "Nhận lại 5% giá trị đơn hàng dưới dạng Coin", unlockedAtRank: "gold", isLocked: false },
      { id: "benefit-birthday-gold", icon: "🎂", title: "Quà sinh nhật", description: "Voucher 200.000₫ trong tháng sinh nhật", unlockedAtRank: "gold", isLocked: false },
      { id: "benefit-workshop-gold", icon: "🎓", title: "Ưu tiên workshop", description: "Đăng ký workshop sớm hơn Member 48 giờ", unlockedAtRank: "gold", isLocked: false },
      { id: "benefit-flashsale", icon: "🏷️", title: "Flash Sale sớm", description: "Vào Flash Sale sớm 2 giờ", unlockedAtRank: "gold", isLocked: false },
    ],
  },
  {
    rank: "diamond",
    displayName: "Diamond",
    icon: "💎",
    minPoints: 8000,
    coinRewardPercent: 6,
    ...rankColors("diamond"),
    benefits: [
      { id: "benefit-coin-diamond", icon: "🪙", title: "Hoàn 6% Coin", description: "Nhận lại 6% giá trị đơn hàng — mức cao nhất!", unlockedAtRank: "diamond", isLocked: false },
      { id: "benefit-birthday-diamond", icon: "🎂", title: "Quà sinh nhật ×2", description: "Voucher 500.000₫ trong tháng sinh nhật", unlockedAtRank: "diamond", isLocked: false },
      { id: "benefit-workshop-diamond", icon: "🎓", title: "Workshop cao cấp miễn phí", description: "Tham gia miễn phí các workshop cao cấp", unlockedAtRank: "diamond", isLocked: false },
      { id: "benefit-flashsale-diamond", icon: "🏷️", title: "Flash Sale siêu sớm", description: "Vào Flash Sale sớm 4 giờ, kèm quà tặng", unlockedAtRank: "diamond", isLocked: false },
    ],
  },
];

// Hằng số FE = fallback. Sau khi GET /membership/config thành công,
// applyMembershipConfig() ghi đè các giá trị này (và minPoints /
// coinRewardPercent trong RANK_CONFIGS) bằng dữ liệu của BE.
export const COIN_RULES = {
  exchangeRate: 1,
  maxUsagePercent: 20,
  minOrderForCoin: 100000,
  expiryMonths: 6,
};

export const POINT_RULES = {
  /** Số ₫ chi tiêu cho 1 điểm. */
  vndPerPoint: 1000,
};

export const RANK_ORDER: RankType[] = ["member", "silver", "gold", "diamond"];

export function rankIndex(rank: RankType): number {
  return RANK_ORDER.indexOf(rank);
}

export interface MembershipConfigInput {
  ranks?: { rank: RankType; displayName?: string; minPoints: number; coinRewardPercent: number }[];
  coinRules?: Partial<typeof COIN_RULES>;
  pointRules?: Partial<typeof POINT_RULES> & Record<string, unknown>;
}

/**
 * Ghi đè ngưỡng điểm / % coin / luật coin bằng config từ BE. Phần hiển thị
 * (icon, gradient, benefits) vẫn lấy từ RANK_CONFIGS của FE.
 */
export function applyMembershipConfig(config: MembershipConfigInput) {
  for (const remote of config.ranks ?? []) {
    const local = RANK_CONFIGS.find((r) => r.rank === remote.rank);
    if (!local) continue;
    if (Number.isFinite(remote.minPoints)) local.minPoints = remote.minPoints;
    if (Number.isFinite(remote.coinRewardPercent)) {
      local.coinRewardPercent = remote.coinRewardPercent;
      // Benefit "Earn X% Coin" phải khớp % thật.
      for (const b of local.benefits) {
        if (!b.id.startsWith("benefit-coin-")) continue;
        b.title = b.title.replace(/\d+(\.\d+)?%/, `${remote.coinRewardPercent}%`);
        b.description = b.description.replace(/\d+(\.\d+)?%/, `${remote.coinRewardPercent}%`);
      }
    }
  }
  const { coinRules, pointRules } = config;
  if (coinRules) {
    for (const key of Object.keys(COIN_RULES) as (keyof typeof COIN_RULES)[]) {
      if (Number.isFinite(coinRules[key])) COIN_RULES[key] = coinRules[key]!;
    }
  }
  if (pointRules && Number.isFinite(pointRules.vndPerPoint) && pointRules.vndPerPoint! > 0) {
    POINT_RULES.vndPerPoint = pointRules.vndPerPoint!;
  }
}

export function getRankFromPoints(points: number): RankType {
  // Duyệt từ hạng cao xuống — dùng minPoints hiện tại (đã ghi đè từ BE nếu có).
  for (let i = RANK_ORDER.length - 1; i > 0; i--) {
    if (points >= getRankConfig(RANK_ORDER[i]).minPoints) return RANK_ORDER[i];
  }
  return "member";
}

export function getNextRank(currentRank: RankType, _points: number): {
  nextRank: RankType | null;
  pointsNeeded: number;
  currentRankPoints: number;
  nextRankPoints: number;
} {
  const currentIndex = rankIndex(currentRank);

  if (currentIndex >= RANK_ORDER.length - 1) {
    return { nextRank: null, pointsNeeded: 0, currentRankPoints: _points, nextRankPoints: _points };
  }

  const nextRankType = RANK_ORDER[currentIndex + 1];
  const nextRankConfig = RANK_CONFIGS.find((r) => r.rank === nextRankType)!;

  return {
    nextRank: nextRankType,
    pointsNeeded: Math.max(0, nextRankConfig.minPoints - _points),
    currentRankPoints: RANK_CONFIGS.find((r) => r.rank === currentRank)!.minPoints,
    nextRankPoints: nextRankConfig.minPoints,
  };
}

export function getRankConfig(rank: RankType): RankConfig {
  return RANK_CONFIGS.find((r) => r.rank === rank) ?? RANK_CONFIGS[0];
}