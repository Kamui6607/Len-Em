// ============================================================
// Order toast store — toast "Đặt hàng thành công" (thay cho toast Sonner của
// thông báo realtime). Mỗi đơn chỉ hiện một lần: id "order-created-{orderId}",
// nhớ cả trong sessionStorage để reload / socket gửi lại cũng không hiện lại.
// ============================================================

import { create } from "zustand";
import { shortId } from "../../lib/displayText";
import { orderService } from "./services/order.service";
import type { PaymentMethod } from "./types/order.types";

export const ORDER_TOAST_DURATION = 5000;
const SHOWN_KEY = "lenem_order_toasts_shown";
const SHOWN_LIMIT = 30;
/** Chờ Checkout báo phương thức thanh toán bấy lâu rồi mới tự hỏi API. */
const PAYMENT_LOOKUP_DELAY = 1500;

export interface OrderToast {
  /** "order-created-{orderId}" */
  id: string;
  orderId: string;
  /** Mã rút gọn giống trang "Đặt hàng thành công" (8 ký tự cuối, in hoa). */
  code: string;
  /** undefined = chưa biết (đang chờ Checkout / API). */
  paymentMethod?: PaymentMethod | null;
  /** Bấm "Xem đơn hàng" — đánh dấu đã đọc thông báo gốc, v.v. */
  onOpen?: () => void;
}

interface OrderToastState {
  toasts: OrderToast[];
  push: (toast: OrderToast) => void;
  dismiss: (id: string) => void;
  setPaymentMethod: (orderId: string, method: PaymentMethod | null) => void;
}

export const useOrderToastStore = create<OrderToastState>((set) => ({
  toasts: [],
  push: (toast) =>
    set((s) => (s.toasts.some((t) => t.id === toast.id) ? s : { toasts: [toast, ...s.toasts] })),
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  setPaymentMethod: (orderId, method) =>
    set((s) => ({
      toasts: s.toasts.map((t) => (t.orderId === orderId ? { ...t, paymentMethod: method } : t)),
    })),
}));

// ── Đã hiện cho đơn nào (sống qua reload trong cùng tab) ──
function readShown(): string[] {
  try {
    const raw = sessionStorage.getItem(SHOWN_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}
function markShown(orderId: string) {
  try {
    const list = readShown().filter((id) => id !== orderId);
    list.push(orderId);
    sessionStorage.setItem(SHOWN_KEY, JSON.stringify(list.slice(-SHOWN_LIMIT)));
  } catch {
    // storage bị chặn — vẫn còn chống trùng theo id trong store
  }
}

// Phương thức thanh toán Checkout vừa gửi. Thông báo socket thường tới TRƯỚC
// response của POST /orders (BE tạo thông báo ngay trong lúc tạo đơn), nên
// cả hai phía đều có thể đến trước — bên nào tới sau thì cập nhật bên kia.
const placedMethods = new Map<string, PaymentMethod>();

export function rememberPlacedOrder(orderId: string, method: PaymentMethod) {
  placedMethods.set(orderId, method);
  useOrderToastStore.getState().setPaymentMethod(orderId, method);
}

/** Lấy mã đơn 24 ký tự từ nội dung "Đơn hàng #<id> của bạn…". */
export function extractOrderId(text: string | undefined): string | null {
  return text?.match(/#?([a-f0-9]{24})\b/i)?.[1] ?? null;
}

export function showOrderCreatedToast(orderId: string, onOpen?: () => void) {
  const id = `order-created-${orderId}`;
  const store = useOrderToastStore.getState();
  if (store.toasts.some((t) => t.id === id) || readShown().includes(orderId)) return;
  markShown(orderId);

  const known = placedMethods.get(orderId);
  store.push({ id, orderId, code: shortId(orderId), paymentMethod: known, onOpen });
  if (known) return;

  // Không đặt từ Checkout trong tab này (hoặc response chưa về): hỏi API.
  window.setTimeout(async () => {
    if (placedMethods.has(orderId)) return;
    const current = useOrderToastStore.getState().toasts.find((t) => t.id === id);
    if (!current || current.paymentMethod !== undefined) return;
    try {
      const { data } = await orderService.getOrderById(orderId);
      useOrderToastStore.getState().setPaymentMethod(orderId, data.order?.payment?.method ?? null);
    } catch {
      useOrderToastStore.getState().setPaymentMethod(orderId, null);
    }
  }, PAYMENT_LOOKUP_DELAY);
}
