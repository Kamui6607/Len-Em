import { useEffect, useState } from "react";
import { Gift, Info } from "lucide-react";
import { cn } from "../ui/utils";
import { formatPrice } from "../../../lib/formatPrice";
import { useMembershipStore } from "../../../features/membership/store/membership.store";
import { COIN_RULES, getRankConfig } from "../../../features/membership/types/membership.types";
import "../../../styles/membership.css";

interface CoinUsageProps {
  /** Tiền hàng (KHÔNG gồm phí ship) — BE tính 20% và ngưỡng tối thiểu trên số này. */
  orderTotal: number;
  onCoinApplied?: (discountAmount: number) => void;
  onCoinRemoved?: () => void;
}

const PRESETS = [
  { label: "25%", ratio: 0.25 },
  { label: "50%", ratio: 0.5 },
  { label: "Tối đa", ratio: 1 },
];

export function CoinUsage({ orderTotal, onCoinApplied, onCoinRemoved }: CoinUsageProps) {
  const { data, calculateMaxCoinUsage, calculateCoinEarn } = useMembershipStore();
  const [useCoin, setUseCoin] = useState(false);
  const [coinAmount, setCoinAmount] = useState(0);

  const maxUsage = calculateMaxCoinUsage(orderTotal);
  const usable = Math.max(0, Math.floor(Math.min(data?.coinBalance ?? 0, maxUsage)));

  // Giỏ hàng / số dư đổi làm số coin đang chọn không còn hợp lệ (vượt 20%,
  // tụt dưới ngưỡng tối thiểu, vượt số dư) → tắt dùng coin.
  useEffect(() => {
    if (useCoin && (usable <= 0 || coinAmount > usable)) {
      setUseCoin(false);
      setCoinAmount(0);
      onCoinRemoved?.();
    }
  }, [useCoin, usable, coinAmount, onCoinRemoved]);

  if (!data) return null;

  const belowMin = orderTotal < COIN_RULES.minOrderForCoin;
  const canUseCoin = usable > 0 && !belowMin;
  const coinEarned = calculateCoinEarn(orderTotal);
  const config = getRankConfig(data.rank);

  const apply = (amount: number) => {
    const value = Math.max(0, Math.min(usable, Math.floor(amount)));
    setCoinAmount(value);
    onCoinApplied?.(value);
  };

  const handleToggle = () => {
    if (!useCoin) {
      setUseCoin(true);
      apply(usable);
    } else {
      setUseCoin(false);
      setCoinAmount(0);
      onCoinRemoved?.();
    }
  };

  const reason = belowMin
    ? `Dùng coin cho đơn từ ${formatPrice(COIN_RULES.minOrderForCoin)} tiền hàng — còn thiếu ${formatPrice(COIN_RULES.minOrderForCoin - orderTotal)}.`
    : data.coinBalance <= 0
      ? `Bạn chưa có coin. Mỗi đơn giao thành công được hoàn ${config.coinRewardPercent}% Coin.`
      : null;

  return (
    <section className="mb-coin co-rise" aria-labelledby="mb-coin-title">
      <div className="mb-coin-head">
        <span className="mb-coin-icon" aria-hidden="true">🪙</span>
        <div className="min-w-0">
          <h2 id="mb-coin-title" className="mb-coin-title">Dùng Len Coin</h2>
          <p className="mb-coin-sub">
            Số dư <b>{data.coinBalance.toLocaleString("vi-VN")} coin</b> ≈ {formatPrice(data.coinBalance)}
          </p>
        </div>
        {canUseCoin && (
          <button
            type="button"
            role="switch"
            aria-checked={useCoin}
            aria-label="Dùng coin cho đơn này"
            className="mb-switch"
            onClick={handleToggle}
          />
        )}
      </div>

      {reason && (
        <p className="mb-coin-note">
          <Info size={15} aria-hidden="true" />
          <span>{reason}</span>
        </p>
      )}

      {useCoin && canUseCoin && (
        <div className="mb-coin-body">
          <div className="mb-coin-row">
            <span>Coin sử dụng</span>
            <span className="mb-coin-amount">−{formatPrice(coinAmount)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={usable}
            step={1}
            value={coinAmount}
            onChange={(e) => apply(Number(e.target.value))}
            className="mb-range"
            aria-label="Số coin muốn dùng"
          />
          <div className="mb-coin-row">
            <span>0</span>
            <span>
              Tối đa {usable.toLocaleString("vi-VN")} coin ({COIN_RULES.maxUsagePercent}% tiền hàng)
            </span>
          </div>
          <div className="mb-coin-presets">
            {PRESETS.map((p) => {
              const value = Math.floor(usable * p.ratio);
              return (
                <button
                  key={p.label}
                  type="button"
                  className={cn("mb-coin-preset", coinAmount === value && "is-active")}
                  onClick={() => apply(value)}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {coinEarned > 0 && (
        <p className="mb-coin-note">
          <Gift size={15} aria-hidden="true" />
          <span>
            Đơn này dự kiến được hoàn <b>~{coinEarned.toLocaleString("vi-VN")} coin</b> ({config.coinRewardPercent}%
            hạng {config.displayName}) khi giao thành công.
          </span>
        </p>
      )}
    </section>
  );
}
