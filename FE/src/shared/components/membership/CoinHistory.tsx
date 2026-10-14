import { Coins, Hourglass, ShoppingBag, type LucideIcon } from "lucide-react";
import type { CoinTransaction } from "../../../features/membership/types/membership.types";
import "../../../styles/membership.css";

interface CoinHistoryProps {
  transactions: CoinTransaction[];
}

const TYPES: Record<CoinTransaction["type"], { label: string; icon: LucideIcon }> = {
  earned: { label: "Nhận coin", icon: Coins },
  used: { label: "Dùng coin", icon: ShoppingBag },
  expired: { label: "Hết hạn", icon: Hourglass },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function CoinHistory({ transactions }: CoinHistoryProps) {
  if (transactions.length === 0) {
    return (
      <div className="mb-empty">
        <span className="mb-empty-icon">
          <Coins size={22} aria-hidden="true" />
        </span>
        <p className="mb-empty-title">Chưa có giao dịch coin</p>
        <p className="mb-empty-desc">Coin được hoàn khi đơn hàng giao thành công và dùng để giảm giá ở bước thanh toán.</p>
      </div>
    );
  }

  return (
    <ul className="mb-entries">
      {transactions.map((tx) => {
        const type = TYPES[tx.type] ?? TYPES.earned;
        const Icon = type.icon;
        // BE trả amount âm cho "used" / "expired"; ép dấu theo type cho chắc.
        const amount = tx.type === "earned" ? Math.abs(tx.amount) : -Math.abs(tx.amount);
        const tone = amount > 0 ? "is-plus" : tx.type === "expired" ? "is-muted" : "is-minus";

        return (
          <li key={tx.id} className="mb-entry">
            <span className="mb-entry-icon" aria-hidden="true">
              <Icon size={17} />
            </span>
            <div className="min-w-0">
              <p className="mb-entry-title">{tx.description}</p>
              <div className="mb-entry-meta">
                <span>{formatDate(tx.date)}</span>
                <span>· {type.label}</span>
                {tx.type === "earned" && tx.expiryDate && <span>· HSD {formatDate(tx.expiryDate)}</span>}
              </div>
            </div>
            <p className={`mb-entry-amount ${tone}`}>
              {amount > 0 ? "+" : "−"}
              {Math.abs(amount).toLocaleString("vi-VN")}
              <small>coin</small>
            </p>
          </li>
        );
      })}
    </ul>
  );
}
