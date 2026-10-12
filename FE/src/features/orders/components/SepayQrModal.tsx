// ============================================================
// SePay (VietQR) — modal mã QR + hook theo dõi thanh toán
// ------------------------------------------------------------
// Dùng chung cho Checkout (đơn hàng giỏ) và trang khoá học (Mua khoá
// học). Không redirect: khách quét mã ngay trên trang, BE xác nhận
// tiền vào qua webhook, còn `useSepayPayment` poll GET /orders/{id}
// mỗi 5 giây — khi payment.status === "PAID" thì gọi onPaid.
// ============================================================

import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { Copy, Landmark, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "../../../lib/formatPrice";
import { orderService } from "../services/order.service";

// ── Thông tin QR hiển thị ngay trên trang sau khi đặt đơn chuyển khoản ──
export interface SepayQrInfo {
  orderId: string;
  payUrl: string;
  account: string;
  bank: string;
  amount: string;
  content: string;
}

/** Tách Số TK / Ngân hàng / Số tiền / Nội dung nhúng sẵn trong payUrl VietQR. */
export function parseSepayPayUrl(payUrl: string): Omit<SepayQrInfo, "orderId" | "payUrl"> {
  try {
    const params = new URL(payUrl).searchParams;
    return {
      account: params.get("acc") ?? "",
      bank: params.get("bank") ?? "",
      amount: params.get("amount") ?? "",
      content: params.get("des") ?? "",
    };
  } catch {
    return { account: "", bank: "", amount: "", content: "" };
  }
}

/** Gọi POST /payment/sepay-payment cho đơn vừa tạo → thông tin QR. */
export async function createSepayQr(orderId: string): Promise<SepayQrInfo> {
  const res = await orderService.createSepayPaymentLink({ orderId });
  if (!res.data.payUrl) throw new Error("SePay did not return a payment QR");
  return { orderId, payUrl: res.data.payUrl, ...parseSepayPayUrl(res.data.payUrl) };
}

/**
 * Poll trạng thái thanh toán của đơn đang hiện QR. Trả về `checking` và
 * `checkNow` cho nút "Tôi đã chuyển khoản — Kiểm tra ngay".
 */
export function useSepayPayment(info: SepayQrInfo | null, onPaid: (orderId: string) => void) {
  const [checking, setChecking] = useState(false);
  const paidRef = useRef(false);
  const onPaidRef = useRef(onPaid);
  onPaidRef.current = onPaid;

  useEffect(() => {
    paidRef.current = false;
  }, [info?.orderId]);

  const verify = useCallback(
    async (silent = true) => {
      if (!info || paidRef.current) return;
      try {
        const { data } = await orderService.getOrderById(info.orderId);
        if (paidRef.current) return;
        if (data.order?.payment?.status === "PAID") {
          paidRef.current = true;
          toast.success("Thanh toán thành công! 🎉");
          onPaidRef.current(info.orderId);
          return;
        }
        if (!silent) toast.info("Chưa nhận được thanh toán. Vui lòng chờ 1–2 phút rồi thử lại.");
      } catch {
        if (!silent) toast.error("Không thể kiểm tra trạng thái đơn hàng. Vui lòng thử lại.");
      }
    },
    [info],
  );

  useEffect(() => {
    if (!info) return;
    // Kiểm tra ngay (khách có thể đã CK xong trước đó) + lặp mỗi 5 giây.
    void verify(true);
    const timer = window.setInterval(() => void verify(true), 5000);
    return () => window.clearInterval(timer);
  }, [info, verify]);

  const checkNow = useCallback(async () => {
    setChecking(true);
    try {
      await verify(false);
    } finally {
      setChecking(false);
    }
  }, [verify]);

  return { checking, checkNow };
}

/**
 * Modal QR SePay — hiển thị mã VietQR + thông tin chuyển khoản để copy tay.
 */
export function SepayQrModal({
  info,
  checking,
  onCheck,
  onClose,
  title = "Thanh toán chuyển khoản",
}: {
  info: SepayQrInfo;
  checking: boolean;
  onCheck: () => void;
  onClose: () => void;
  title?: string;
}) {
  // ESC để đóng modal
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const copy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`Đã copy ${label}`);
    } catch {
      toast.error("Không thể copy — vui lòng copy thủ công.");
    }
  };

  const rows: { label: string; display: string; copyValue?: string }[] = [
    { label: "Số tài khoản", display: info.account, copyValue: info.account },
    { label: "Ngân hàng", display: info.bank, copyValue: info.bank },
    {
      label: "Số tiền",
      display: info.amount ? formatPrice(Number(info.amount)) : "",
      copyValue: info.amount,
    },
    { label: "Nội dung chuyển khoản", display: info.content, copyValue: info.content },
  ];

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md max-h-[92vh] overflow-y-auto rounded-3xl border border-border bg-card p-6 shadow-2xl">
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng"
          className="absolute right-4 top-4 w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-5">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
            <Landmark className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Vui lòng mở ứng dụng ngân hàng và quét mã QR để thanh toán.
          </p>
        </div>

        {/* QR */}
        <div className="mx-auto w-fit rounded-2xl border border-border bg-white p-3 shadow-sm">
          <img src={info.payUrl} alt="Mã QR Thanh Toán" className="w-64 h-64 object-contain" />
        </div>

        {/* Waiting status */}
        <div className="flex items-center justify-center gap-2 mt-4 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span>Đang chờ xác nhận thanh toán…</span>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">
          Hệ thống sẽ tự động xác nhận đơn hàng của bạn trong vòng 1–2 phút sau khi chuyển khoản
          thành công.
        </p>

        {/* Bank info — copy tay nếu không quét được mã */}
        <div className="mt-5 space-y-2">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-muted/40 px-3.5 py-2.5"
            >
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground">{row.label}</p>
                <p className="text-sm font-semibold truncate">{row.display || "—"}</p>
              </div>
              {row.copyValue && (
                <button
                  type="button"
                  onClick={() => copy(row.copyValue!, row.label)}
                  className="flex-shrink-0 inline-flex items-center gap-1.5 text-xs font-medium text-primary border border-primary/30 rounded-full px-3 py-1.5 hover:bg-primary/10 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copy
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Actions */}
        <button
          type="button"
          onClick={onCheck}
          disabled={checking}
          className="w-full mt-5 text-primary-foreground py-3.5 rounded-full text-sm font-semibold transition-all hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-60 disabled:transform-none disabled:cursor-not-allowed"
          style={{ background: "var(--cta-gradient)", boxShadow: "var(--cta-shadow)" }}
        >
          {checking ? "Đang kiểm tra..." : "Tôi đã chuyển khoản — Kiểm tra ngay"}
        </button>
        <Link
          to={`/purchased/${info.orderId}`}
          className="block text-center text-sm text-muted-foreground hover:text-foreground mt-3 transition-colors"
        >
          Thanh toán sau — xem chi tiết đơn hàng
        </Link>
      </div>
    </div>
  );
}
