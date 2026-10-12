// ============================================================
// OrderThread — tiến trình đơn hàng dạng "sợi chỉ khâu"
// Mỗi bước là một mũi khâu, các bước nối nhau bằng sợi chỉ:
// đoạn đã qua là chỉ liền màu brand, đoạn chưa tới là chỉ đứt nét.
// Đơn huỷ / bị từ chối hiển thị "sợi chỉ bị cắt" thay cho tiến trình.
// Dùng chung cho /purchased (compact) và /purchased/:id (full).
// ============================================================

import {
  Check,
  Clock,
  PackageCheck,
  PackageOpen,
  Scissors,
  Truck,
  type LucideIcon,
} from "lucide-react";
import { ORDER_STATUS_LABELS } from "../../../constants/orderStatus";
import type { OrderStatus } from "../../../features/orders/types/order.types";

const STEPS: { status: OrderStatus; label: string; icon: LucideIcon }[] = [
  { status: "PENDING", label: "Đặt hàng", icon: Clock },
  { status: "CONFIRMED", label: "Xác nhận", icon: Check },
  { status: "PREPARING", label: "Chuẩn bị", icon: PackageOpen },
  { status: "SHIPPING", label: "Đang giao", icon: Truck },
  { status: "DELIVERED", label: "Đã nhận", icon: PackageCheck },
];

/** Vị trí của trạng thái trên sợi chỉ; -1 nếu đơn đã bị cắt ngang (huỷ/từ chối). */
export function getOrderStepIndex(status: string): number {
  if (status === "PROCESSED") return STEPS.length - 1;
  return STEPS.findIndex((s) => s.status === status);
}

export function isOrderCut(status: string): boolean {
  return status === "CANCELLED" || status === "REJECTED";
}

interface OrderThreadProps {
  status: string;
  compact?: boolean;
}

export function OrderThread({ status, compact = false }: OrderThreadProps) {
  if (isOrderCut(status)) {
    return (
      <div className={`order-thread-cut ${compact ? "is-compact" : ""}`}>
        <span className="order-thread-cut-line" aria-hidden />
        <span className="order-thread-cut-icon">
          <Scissors className="w-3.5 h-3.5" />
        </span>
        <span className="order-thread-cut-label">
          {ORDER_STATUS_LABELS[status as OrderStatus] ?? status}
        </span>
        <span className="order-thread-cut-line is-loose" aria-hidden />
      </div>
    );
  }

  const current = Math.max(0, getOrderStepIndex(status));
  const finished = current === STEPS.length - 1;

  return (
    <ol
      className={`order-thread ${compact ? "is-compact" : ""}`}
      aria-label={`Tiến trình: ${ORDER_STATUS_LABELS[status as OrderStatus] ?? status}`}
    >
      {STEPS.map((step, i) => {
        const state =
          i < current || (finished && i === current)
            ? "is-done"
            : i === current
              ? "is-current"
              : "is-upcoming";
        const Icon = step.icon;
        return (
          <li key={step.status} className={`order-thread-step ${state}`}>
            {i > 0 && (
              <span
                className={`order-thread-line ${i <= current ? "is-done" : ""}`}
                aria-hidden
              />
            )}
            <span className="order-thread-knot">
              {state === "is-done" && !compact ? (
                <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
              ) : (
                <Icon className={compact ? "w-3 h-3" : "w-3.5 h-3.5"} />
              )}
            </span>
            {!compact && <span className="order-thread-label">{step.label}</span>}
          </li>
        );
      })}
    </ol>
  );
}
