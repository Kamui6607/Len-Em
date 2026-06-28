// ============================================================
// Zustand Membership Store
// ============================================================

import { create } from "zustand";
import type { MembershipData, MembershipHistoryEntry, CoinTransaction, RankType } from "../types/membership.types";
import { getRankFromPoints, getRankConfig } from "../types/membership.types";
import { mockMembership, mockMembershipHistory, mockCoinTransactions } from "../data/membership.mock";

interface MembershipState {
  // State
  data: MembershipData | null;
  history: MembershipHistoryEntry[];
  coinTransactions: CoinTransaction[];
  loading: boolean;
  error: string | null;
  showRankUpPopup: boolean;
  previousRank: RankType | null;

  // Actions
  initialize: () => Promise<void>;
  addPoints: (points: number, source: MembershipHistoryEntry["source"], description: string, orderId?: string, orderAmount?: number) => void;
  addCoin: (amount: number, description: string, orderId?: string) => void;
  useCoin: (amount: number, description: string, orderId?: string) => boolean;
  dismissRankUpPopup: () => void;
  calculateCoinEarn: (orderAmount: number) => number;
  calculateMaxCoinUsage: (orderAmount: number) => number;
}

export const useMembershipStore = create<MembershipState>((set, get) => ({
  // Initial state
  data: null,
  history: [],
  coinTransactions: [],
  loading: true,
  error: null,
  showRankUpPopup: false,
  previousRank: null,

  initialize: async () => {
    set({ loading: true, error: null });
    try {
      // Simulate API fetch
      await new Promise((r) => setTimeout(r, 300));

      set({
        data: mockMembership,
        history: mockMembershipHistory,
        coinTransactions: mockCoinTransactions,
        loading: false,
      });
        } catch {
      set({ error: "Failed to load membership data", loading: false });
    }
  },

  addPoints: (points, source, description, orderId?, orderAmount?) => {
    const state = get();
    if (!state.data) return;

    const oldRank = state.data.rank;
    const newPoints = state.data.points + points;
    const newRank = getRankFromPoints(newPoints);

    const newHistoryEntry: MembershipHistoryEntry = {
      id: `hist-${Date.now()}`,
      date: new Date().toISOString(),
      points,
      source,
      description,
      orderId,
      orderAmount,
      newRank: newRank !== oldRank ? newRank : undefined,
      status: "completed",
    };

    set({
      data: {
        ...state.data,
        points: newPoints,
        rank: newRank,
        totalSpent: orderAmount ? state.data.totalSpent + orderAmount : state.data.totalSpent,
      },
      history: [newHistoryEntry, ...state.history],
      previousRank: newRank !== oldRank ? oldRank : null,
      showRankUpPopup: newRank !== oldRank,
    });
  },

  addCoin: (amount, description, orderId?) => {
    const state = get();
    if (!state.data) return;

    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 6);

    const newTransaction: CoinTransaction = {
      id: `coin-${Date.now()}`,
      date: new Date().toISOString(),
      amount,
      type: "earned",
      description,
      orderId,
      expiryDate: expiryDate.toISOString(),
    };

    set({
      data: { ...state.data, coinBalance: state.data.coinBalance + amount },
      coinTransactions: [newTransaction, ...state.coinTransactions],
    });
  },

  useCoin: (amount, description, orderId?) => {
    const state = get();
    if (!state.data) return false;
    if (state.data.coinBalance < amount) return false;

    const newTransaction: CoinTransaction = {
      id: `coin-use-${Date.now()}`,
      date: new Date().toISOString(),
      amount: -amount,
      type: "used",
      description,
      orderId,
    };

    set({
      data: { ...state.data, coinBalance: state.data.coinBalance - amount },
      coinTransactions: [newTransaction, ...state.coinTransactions],
    });
    return true;
  },

  dismissRankUpPopup: () => {
    set({ showRankUpPopup: false, previousRank: null });
  },

  calculateCoinEarn: (orderAmount: number) => {
    const state = get();
    if (!state.data) return 0;
    const config = getRankConfig(state.data.rank);
    return Math.floor(orderAmount * (config.coinRewardPercent / 100));
  },

  calculateMaxCoinUsage: (orderAmount: number) => {
    if (orderAmount < 100000) return 0;
    return Math.floor(orderAmount * 0.2);
  },
}));