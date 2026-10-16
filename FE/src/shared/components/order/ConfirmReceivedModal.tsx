// ============================================================
// Hộp xác nhận "Đã nhận hàng" — tránh khách bấm nhầm / bấm sớm.
// Đơn COD nhắc thêm: chỉ bấm khi đã trả tiền cho shipper.
// ============================================================

import { toText } from "../../../lib/displayText";
import type { Order } from "../../../features/orders/types/order.types";
import { useLanguage } from "../../contexts/LanguageContext";

interface ConfirmReceivedModalProps {
  order: Order;
  submitting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmReceivedModal({ order, submitting, onConfirm, onClose }: ConfirmReceivedModalProps) {
  const { t } = useLanguage();
  const isCod = ["COD", "CASH"].includes(toText(order.payment?.method));

  return (
    <div className="order-modal-overlay" onClick={() => !submitting && onClose()}>
      <div className="order-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="order-modal-title">{t("purchased.receiveModalTitle")}</h3>
        <p className="text-sm text-muted-foreground mb-2">{t("purchased.receiveModalDesc")}</p>
        {isCod && <p className="text-sm font-medium text-foreground mb-2">{t("purchased.receiveModalCodNote")}</p>}
        <div className="flex gap-3 mt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="flex-1 py-2.5 rounded-full text-sm border border-border hover:bg-muted transition-colors disabled:opacity-50"
          >
            {t("purchased.receiveModalBack")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={submitting}
            className="flex-1 py-2.5 rounded-full text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {submitting ? t("purchased.receiveModalSubmitting") : t("purchased.receiveModalSubmit")}
          </button>
        </div>
      </div>
    </div>
  );
}
