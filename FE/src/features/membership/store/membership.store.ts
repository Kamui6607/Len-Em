// ============================================================
// Zustand Membership Store
// BE là nguồn đúng duy nhất cho điểm / hạng / coin — store chỉ nạp và
// hiển thị, không tự cộng trừ. Chỉ khởi tạo khi đã đăng nhập (App.tsx).
// ============================================================

import { create } from "zustand";
import type { MembershipData, MembershipHistoryEntry, CoinTransaction, RankType } from "../types/membership.types";
import { applyMembershipConfig, COIN_RULES, getRankConfig, rankIndex } from "../types/membership.types";
import { membershipService, type MembershipMeResponse } from "../services/membership.service";

const PAGE_SIZE = 20;
const SEEN_RANK_KEY = "lenem_membership_seen_rank";

// ── Hạng đã "thấy" lần trước (theo userId) — để bật popup lên hạng một lần ──
function readSeenRank(userId: string): RankType | null {
  try {
    return (localStorage.getItem(`${SEEN_RANK_KEY}:${userId}`) as RankType | null) ?? null;
  } catch {
    return null;
  }
}

function writeSeenRank(userId: string, rank: RankType) {
  try {
    localStorage.setItem(`${SEEN_RANK_KEY}:${userId}`, rank);
  } catch {
    /* private mode / quota — bỏ qua */
  }
}

// Config chỉ gọi một lần mỗi phiên; lỗi → giữ hằng số FE làm fallback.
let configPromise: Promise<void> | null = null;
function loadConfigOnce(): Promise<void> {
  configPromise ??= membershipService
    .getConfig()
    .then((res) => applyMembershipConfig(res.data.data))
    .catch(() => {
      configPromise = null; // lần khởi tạo sau thử lại
    });
  return configPromise;
}

// Tăng mỗi lần reset → bỏ qua response của phiên/user trước còn đang bay về.
let session = 0;

interface MembershipState {
  // State
  data: MembershipData | null;
  history: MembershipHistoryEntry[];
  coinTransactions: CoinTransaction[];
  historyPage: number;
  hasMoreHistory: boolean;
  loadingMoreHistory: boolean;
  coinsPage: number;
  hasMoreCoins: boolean;
  loadingMoreCoins: boolean;
  loading: boolean;
  error: string | null;
  /** Đổi khi config từ BE đã áp dụng → component đọc ngưỡng mới sẽ render lại. */
  configLoaded: boolean;
  showRankUpPopup: boolean;
  previousRank: RankType | null;

  // Actions
  initialize: () => Promise<void>;
  refresh: () => Promise<void>;
  loadMoreHistory: () => Promise<void>;
  loadMoreCoins: () => Promise<void>;
  reset: () => void;
  dismissRankUpPopup: () => void;
  calculateCoinEarn: (orderAmount: number) => number;
  calculateMaxCoinUsage: (orderAmount: number) => number;
}

const emptyState = {
  data: null,
  history: [],
  coinTransactions: [],
  historyPage: 1,
  hasMoreHistory: false,
  loadingMoreHistory: false,
  coinsPage: 1,
  hasMoreCoins: false,
  loadingMoreCoins: false,
  loading: true,
  error: null,
  showRankUpPopup: false,
  previousRank: null,
} satisfies Partial<MembershipState>;

export const useMembershipStore = create<MembershipState>((set, get) => {
  /** Nạp kết quả GET /membership/me + kiểm tra lên hạng. */
  const applyMe = (me: MembershipMeResponse) => {
    const { membership, history, coinTransactions } = me;
    const seen = readSeenRank(membership.userId);
    let rankUp: Pick<MembershipState, "showRankUpPopup" | "previousRank"> | null = null;
    if (!seen) {
      // Lần đầu: chỉ ghi nhớ, không bật popup.
      writeSeenRank(membership.userId, membership.rank);
    } else if (rankIndex(membership.rank) > rankIndex(seen)) {
      rankUp = { showRankUpPopup: true, previousRank: seen };
    } else if (rankIndex(membership.rank) < rankIndex(seen)) {
      writeSeenRank(membership.userId, membership.rank);
    }

    set({
      data: membership,
      history,
      coinTransactions,
      historyPage: 1,
      hasMoreHistory: history.length >= PAGE_SIZE,
      coinsPage: 1,
      hasMoreCoins: coinTransactions.length >= PAGE_SIZE,
      loading: false,
      error: null,
      ...rankUp,
    });
  };

  return {
    ...emptyState,
    configLoaded: false,

    initialize: async () => {
      const mine = session;
      set({ loading: true, error: null });
      loadConfigOnce().then(() => {
        if (configPromise) set({ configLoaded: true });
      });
      try {
        const res = await membershipService.getMe(PAGE_SIZE);
        if (mine !== session) return;
        applyMe(res.data.data);
      } catch {
        if (mine !== session) return;
        set({ error: "Không tải được thông tin thành viên", loading: false });
      }
    },

    refresh: async () => {
      const mine = session;
      try {
        const res = await membershipService.getMe(PAGE_SIZE);
        if (mine !== session) return;
        applyMe(res.data.data);
      } catch {
        // Giữ dữ liệu đang hiển thị; lần refresh sau sẽ thử lại.
      }
    },

    loadMoreHistory: async () => {
      const { hasMoreHistory, loadingMoreHistory, historyPage } = get();
      if (!hasMoreHistory || loadingMoreHistory) return;
      const mine = session;
      const page = historyPage + 1;
      set({ loadingMoreHistory: true });
      try {
        const res = await membershipService.getHistory(page, PAGE_SIZE);
        if (mine !== session) return;
        const { history: more, pagination } = res.data.data;
        set((s) => {
          const ids = new Set(s.history.map((h) => h.id));
          return {
            history: [...s.history, ...more.filter((h) => !ids.has(h.id))],
            historyPage: page,
            hasMoreHistory: page * pagination.limit < pagination.total,
            loadingMoreHistory: false,
          };
        });
      } catch {
        if (mine === session) set({ loadingMoreHistory: false });
      }
    },

    loadMoreCoins: async () => {
      const { hasMoreCoins, loadingMoreCoins, coinsPage } = get();
      if (!hasMoreCoins || loadingMoreCoins) return;
      const mine = session;
      const page = coinsPage + 1;
      set({ loadingMoreCoins: true });
      try {
        const res = await membershipService.getCoinTransactions(page, PAGE_SIZE);
        if (mine !== session) return;
        const { coinTransactions: more, pagination } = res.data.data;
        set((s) => {
          const ids = new Set(s.coinTransactions.map((c) => c.id));
          return {
            coinTransactions: [...s.coinTransactions, ...more.filter((c) => !ids.has(c.id))],
            coinsPage: page,
            hasMoreCoins: page * pagination.limit < pagination.total,
            loadingMoreCoins: false,
          };
        });
      } catch {
        if (mine === session) set({ loadingMoreCoins: false });
      }
    },

    reset: () => {
      session++;
      set({ ...emptyState });
    },

    dismissRankUpPopup: () => {
      const { data } = get();
      if (data) writeSeenRank(data.userId, data.rank);
      set({ showRankUpPopup: false, previousRank: null });
    },

    // Ước tính hiển thị ở client — số thật do BE tính khi đơn được giao.
    calculateCoinEarn: (orderAmount: number) => {
      const { data } = get();
      if (!data) return 0;
      return Math.floor(orderAmount * (getRankConfig(data.rank).coinRewardPercent / 100));
    },

    calculateMaxCoinUsage: (orderAmount: number) => {
      if (orderAmount < COIN_RULES.minOrderForCoin) return 0;
      return Math.floor(orderAmount * (COIN_RULES.maxUsagePercent / 100));
    },
  };
});
