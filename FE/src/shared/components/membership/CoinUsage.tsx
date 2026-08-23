import { useState } from "react";
import { cn } from "../ui/utils";
import { formatPrice } from "../../../lib/formatPrice";
import { useMembershipStore } from "../../../features/membership/store/membership.store";
import { COIN_RULES, getRankConfig } from "../../../features/membership/types/membership.types";

interface CoinUsageProps {
  orderTotal: number;
  onCoinApplied?: (discountAmount: number) => void;
  onCoinRemoved?: () => void;
}

export function CoinUsage({ orderTotal, onCoinApplied, onCoinRemoved }: CoinUsageProps) {
  const { data, calculateMaxCoinUsage, calculateCoinEarn } = useMembershipStore();
  const [useCoin, setUseCoin] = useState(false);
  const [coinAmount, setCoinAmount] = useState(0);

  if (!data) return null;

  const maxUsage = calculateMaxCoinUsage(orderTotal);
  const canUseCoin = data.coinBalance > 0 && orderTotal >= COIN_RULES.minOrderForCoin && maxUsage > 0;
  const coinEarned = calculateCoinEarn(orderTotal);
  const config = getRankConfig(data.rank);

  const handleToggle = () => {
    if (!useCoin) {
      const suggested = Math.min(data.coinBalance, maxUsage);
      setCoinAmount(suggested);
      setUseCoin(true);
      onCoinApplied?.(suggested);
    } else {
      setCoinAmount(0);
      setUseCoin(false);
      onCoinRemoved?.();
    }
  };

  if (!canUseCoin && !useCoin) {
    return (
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🪙</span>
            <div>
              <p className="text-xs font-medium">Your Coins</p>
              <p className="text-sm font-bold">{data.coinBalance.toLocaleString()} Coin</p>
            </div>
          </div>
          {orderTotal < COIN_RULES.minOrderForCoin && (
            <span className="text-[10px] text-muted-foreground">
              Min. order {formatPrice(COIN_RULES.minOrderForCoin)}
            </span>
          )}
        </div>
        {data.coinBalance === 0 && (
          <p className="text-[10px] text-muted-foreground mt-2">
            Shop to earn Coin! You currently get {config.coinRewardPercent}% of order value.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🪙</span>
          <div>
            <p className="text-xs font-medium">Use Coin</p>
            <p className="text-xs text-muted-foreground">
              Balance: {data.coinBalance.toLocaleString()} Coin ≈ {formatPrice(data.coinBalance)}
            </p>
          </div>
        </div>
        <button
          onClick={handleToggle}
          className={cn(
            "relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30",
            useCoin ? "bg-primary" : "bg-border"
          )}
          style={{ touchAction: "manipulation" }}
          aria-label={useCoin ? "Remove coin usage" : "Use coin"}
        >
          <div
            className={cn(
              "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200",
              useCoin ? "translate-x-5" : "translate-x-0"
            )}
          />
        </button>
      </div>

      {useCoin && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Coin to use:</span>
            <span className="font-semibold">{coinAmount.toLocaleString()} Coin</span>
          </div>
          <input
            type="range"
            min={0}
            max={Math.min(data.coinBalance, maxUsage)}
            value={coinAmount}
            onChange={(e) => {
              const val = Number(e.target.value);
              setCoinAmount(val);
              onCoinApplied?.(val);
            }}
            className="w-full accent-primary"
            style={{ height: 6, borderRadius: 4 }}
            aria-label="Coin amount slider"
          />

          <div className="bg-muted/40 rounded-lg p-3 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Discount</span>
              <span className="font-semibold text-primary">-{formatPrice(coinAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total</span>
              <span className="font-semibold">{formatPrice(orderTotal - coinAmount)}</span>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 text-xs text-muted-foreground border-t border-border pt-3">
        <span>🎁</span>
        <span>
          You'll earn <strong className="text-foreground">{coinEarned.toLocaleString()} Coin </strong> 
          after placing this order!
        </span>
      </div>
    </div>
  );
}