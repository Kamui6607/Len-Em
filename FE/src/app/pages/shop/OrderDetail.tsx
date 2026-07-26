// ============================================================
// OrderDetail Page — route /purchased/:id
// Customer xem chi tiết đơn hàng + huỷ nếu PENDING
// ============================================================

import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { orderApi } from "../../../api/orderService";
import { OrderDetailCard } from "../../components/order/OrderDetailCard";
import type { Order } from "../../../features/orders/types/order.types";
import { useLanguage } from "../../../context/LanguageContext";

export function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useLanguage();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    async function loadOrder() {
      try {
        const { data } = await orderApi.getOrderById(id!);
        setOrder(data.order ?? null);
      } catch {
        toast.error(t("orderDetail.loadError"));
      } finally {
        setLoading(false);
      }
    }
    loadOrder();
  }, [id]);

  const handleCancel = async (orderId: string, reason: string) => {
    try {
      await orderApi.cancelOrder(orderId, { cancelReason: reason });
      // Refresh order data
      const { data } = await orderApi.getOrderById(orderId);
      setOrder(data.order ?? null);
      toast.success(t("orderDetail.cancelSuccess"));
    } catch {
      toast.error(t("orderDetail.cancelError"));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-semibold mb-3">{t("orderDetail.notFoundTitle")}</h2>
          <p className="text-muted-foreground mb-6">
            {t("orderDetail.notFoundDesc")}
          </p>
          <Link
            to="/purchased"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full hover:bg-primary/90 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("orderDetail.backToList")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <Link
          to="/purchased"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("orderDetail.backToOrders")}
        </Link>

        <OrderDetailCard
          order={order}
          isAdminView={false}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}