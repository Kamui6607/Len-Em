// ============================================================
// OrderDetail Page — route /purchased/:id
// Customer xem chi tiết đơn hàng + huỷ nếu PENDING
// ============================================================

import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { orderService } from "../../../features/orders/services/order.service";
import { OrderDetailCard } from "../../../shared/components/order/OrderDetailCard";
import type { Order } from "../../../features/orders/types/order.types";
import { useAuthStore } from "../../../shared/store/auth.store";
import { useLanguage } from "../../../shared/contexts/LanguageContext";
import { EmptyHoopIllustration } from "./CartPage";
import "../../../styles/purchased.css";

export function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useLanguage();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  // Re-fetch the user profile when opening an order — after a payment
  // the backend webhook may have just granted course purchases.
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  useEffect(() => {
    if (isAuthenticated) {
      void refreshProfile();
    }
  }, [isAuthenticated, t, refreshProfile]);

  useEffect(() => {
    if (!id) return;
    async function loadOrder() {
      try {
        const { data } = await orderService.getOrderById(id!);
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
      await orderService.cancelOrder(orderId, { cancelReason: reason });
      // Refresh order data
      const { data } = await orderService.getOrderById(orderId);
      setOrder(data.order ?? null);
      toast.success(t("orderDetail.cancelSuccess"));
    } catch {
      toast.error(t("orderDetail.cancelError"));
    }
  };

  const handleRetryPayment = async (orderId: string) => {
    try {
      const { data } = await orderService.retryPayment(orderId);
      setOrder(data.order ?? null);
      // Redirect to payment URL
      if (data.payUrl) {
        // Use setTimeout to avoid toast blocking the redirect
        toast.success("Đang chuyển đến cổng thanh toán...");
        setTimeout(() => {
          window.location.href = data.payUrl;
        }, 500);
      } else {
        toast.error("Không thể tạo link thanh toán. Vui lòng thử lại sau.");
      }
    } catch {
      toast.error("Không thể khởi tạo thanh toán lại. Vui lòng thử lại sau.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-8 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="purchased-skeleton h-4 w-48 mb-6" />
          <div className="purchased-skeleton h-64 w-full rounded-3xl mb-6" />
          <div className="grid gap-6 md:grid-cols-[1fr_340px]">
            <div className="purchased-skeleton h-72 rounded-3xl" />
            <div className="purchased-skeleton h-72 rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="purchased-empty">
          <EmptyHoopIllustration size={160} />
          <h2 className="purchased-empty-title">{t("orderDetail.notFoundTitle")}</h2>
          <p className="purchased-empty-desc">{t("orderDetail.notFoundDesc")}</p>
          <Link to="/purchased" className="purchased-empty-btn">
            <ArrowLeft className="w-4 h-4" />
            {t("orderDetail.backToList")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-8 px-4 pb-[calc(env(safe-area-inset-bottom)+72px)] md:pb-12">
      <div className="max-w-5xl mx-auto">
        <Link to="/purchased" className="order-detail-back">
          <ArrowLeft className="w-4 h-4" />
          {t("orderDetail.backToOrders")}
        </Link>

        <OrderDetailCard
          order={order}
          isAdminView={false}
          onCancel={handleCancel}
          onRetryPayment={handleRetryPayment}
        />
      </div>
    </div>
  );
}