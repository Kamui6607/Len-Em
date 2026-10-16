// ============================================================
// Khách xác nhận "Đã nhận hàng" — SHIPPING → DELIVERED
// Dùng chung cho trang Purchased (danh sách) và OrderDetail (chi tiết).
// Đơn COD: BE tự set payment PAID + paidAt → luôn lấy order từ BE, không tự đoán.
// ============================================================

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { orderService } from "./services/order.service";
import { normalizeOrder, pickOrderFromResponse, type Order } from "./types/order.types";
import { extractApiErrorMessage } from "../../lib/apiError";
import { useLanguage } from "../../shared/contexts/LanguageContext";
import { useNotifications } from "../../shared/contexts/NotificationContext";

export function useConfirmReceived() {
  const { t } = useLanguage();
  const { addNotification } = useNotifications();
  const [markingId, setMarkingId] = useState<string | null>(null);
  // Chặn gửi 2 lần khi bấm liên tiếp trước khi state kịp cập nhật
  const inFlight = useRef(false);

  /** Trả về order đã cập nhật từ BE, hoặc null nếu thất bại. */
  const confirmReceived = useCallback(
    async (order: Order): Promise<Order | null> => {
      if (inFlight.current || order.orderStatus !== "SHIPPING") return null;
      inFlight.current = true;
      setMarkingId(order._id);
      try {
        const { data } = await orderService.updateOrderStatus(order._id, { orderStatus: "DELIVERED" });
        const fromResponse = pickOrderFromResponse(data);
        const updated = fromResponse ?? (await orderService.getOrderById(order._id)).data.order;

        // Nhắc đánh giá từng sản phẩm trong đơn
        order.items.forEach((item) => {
          addNotification({
            type: "review_request",
            title: t("purchased.notificationTitle"),
            message: t("purchased.notificationMessage", {
              productName: item.productName,
              orderId: order._id,
            }),
            targetId: order._id,
            targetPath: "/purchased",
          });
        });
        toast.success(t("purchased.toastMarkDoneSuccess"));
        return updated ? normalizeOrder(updated) : null;
      } catch (err) {
        toast.error(extractApiErrorMessage(err) || t("purchased.toastMarkDoneError"));
        return null;
      } finally {
        inFlight.current = false;
        setMarkingId(null);
      }
    },
    [addNotification, t],
  );

  return { confirmReceived, markingId };
}
