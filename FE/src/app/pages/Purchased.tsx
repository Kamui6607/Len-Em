import { useState, useEffect, useMemo } from "react";
import {
  Package,
  Calendar,
  Star,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "../../lib/formatPrice";
import { useAuth } from "../../shared/hooks/useAuth";
import { useCart } from "../../shared/contexts/CartContext";
import { useReviews } from "../../shared/contexts/ReviewContext";
import { useNotifications } from "../../shared/contexts/NotificationContext";
import { ReportButton } from "../../shared/components/ReportButton";
import { Link, useNavigate } from "react-router";
import { orderService } from "../../features/orders/services/order.service";
import { productService } from "../../shared/api/productService";
import { kitService } from "../../shared/api/kitService";
import type { Order, OrderItem } from "../../features/orders/types/order.types";
import { normalizeOrder } from "../../features/orders/types/order.types";
import { getOrderStatusBadgeClass } from "../../constants/orderStatus";
import { useLanguage } from "../../shared/contexts/LanguageContext";

const PAGE_SIZE = 10;

export function Purchased() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { addReview, hasReviewed } = useReviews();
  const { addNotification } = useNotifications();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [reviewModal, setReviewModal] = useState<{
    orderId: string;
    productId: string;
    productName: string;
  } | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [cancelModal, setCancelModal] = useState<{
    orderId: string;
    reason: string;
  } | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [kitNames, setKitNames] = useState<Record<string, string>>({});
  const [kitNamesLoaded, setKitNamesLoaded] = useState(false);
  const { addToCart, addKitToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    async function loadOrders() {
      try {
        const { data: response } = await orderService.getMyOrders({
          page,
          limit: PAGE_SIZE,
        });
        const normalizedOrders = response.orders.map(normalizeOrder);
        setOrders(normalizedOrders);
        setTotal(response.total ?? 0);
        setTotalPages(response.totalPages ?? 1);
        setKitNamesLoaded(false);

        // Fetch kit names for all unique kitIds in parallel
        const uniqueKitIds = new Set<string>();
        normalizedOrders.forEach((order) => {
          order.items.forEach((item) => {
            if (item.kitId) uniqueKitIds.add(item.kitId);
          });
        });

        if (uniqueKitIds.size > 0) {
          const kitResults = await Promise.all(
            Array.from(uniqueKitIds).map(async (kitId) => {
              try {
                const res = await kitService.getById(kitId);
                return { kitId, name: res.data.data?.kit?.name || "Kit" };
              } catch {
                return { kitId, name: "Kit" };
              }
            }),
          );
          const kitNameMap = kitResults.reduce(
            (acc, { kitId, name }) => {
              if (name) acc[kitId] = name;
              return acc;
            },
            {} as Record<string, string>,
          );
          setKitNames(kitNameMap);
        }
        setKitNamesLoaded(true);
      } catch {
        // API unavailable — empty state (demo mode / offline)
        setKitNamesLoaded(true);
      } finally {
        setLoading(false);
      }
    }
    if (user) loadOrders();
    else setLoading(false);
  }, [user, page]);

  const handleSubmitReview = async () => {
    if (!reviewModal || !comment.trim()) {
      toast.error(t("purchased.toastReviewRequired"));
      return;
    }
    try {
      // Find the order and item to check if it has a kitId
      const order = orders.find((o) => o._id === reviewModal.orderId);
      const item = order?.items.find(
        (i) => i.productId === reviewModal.productId,
      );

      if (item?.kitId) {
        // If item belongs to a kit, rate the kit instead
        await kitService.rate(item.kitId, rating);
      } else {
        // Otherwise, rate the product
        await productService.rateProduct(reviewModal.productId, rating);
      }

      addReview({
        orderId: reviewModal.orderId,
        productId: reviewModal.productId,
        productName: reviewModal.productName,
        userId: user?.email || "unknown",
        userName: user?.fullName || "User",
        rating,
        comment: comment.trim(),
      });
      toast.success(t("purchased.toastReviewSuccess"));
      setReviewModal(null);
      setComment("");
      setRating(5);
    } catch {
      toast.error(t("purchased.toastReviewError"));
    }
  };

  /** Group items by kitId — items without kitId stay as standalone items */
  const groupItemsByKit = useMemo(() => {
    return (orderItems: Order["items"]) => {
      const kitGroups: { kitId: string; items: OrderItem[] }[] = [];
      const standalone: OrderItem[] = [];

      orderItems.forEach((item) => {
        if (item.kitId) {
          let group = kitGroups.find((g) => g.kitId === item.kitId);
          if (!group) {
            group = { kitId: item.kitId, items: [] };
            kitGroups.push(group);
          }
          group.items.push(item);
        } else {
          standalone.push(item);
        }
      });

      return { kitGroups, standalone };
    };
  }, []);

  const handleReorder = async (order: Order) => {
    const { kitGroups, standalone } = groupItemsByKit(order.items);
    
    // Reorder kits - add entire kit back to cart
    for (const group of kitGroups) {
      try {
        const { data } = await kitService.getById(group.kitId);
        const kit = data.data?.kit;
        if (kit) {
          const products = (kit.products || []).map((kitProduct) => {
            const product = kitProduct.productId;
            const firstVariant = product?.variants?.[0];
            return {
              productId: product._id,
              variantId: kitProduct.variantId,
              name: product.name,
              image: firstVariant?.image || product.image,
              price: firstVariant?.price || 0,
            };
          });

          addKitToCart({
            kitId: kit._id,
            name: kit.name,
            thumbnail: kit.thumbnail,
            price: kit.price,
            products,
          });
        }
      } catch {
        // If kit fetch fails, add items individually as fallback
        group.items.forEach((item) => {
          addToCart(
            {
              productId: item.productId,
              variantId: item.productId,
              name: item.productName || "Product",
              image: item.image || "",
              color: item.color || "",
              hexCode: item.hexCode || "",
              price: item.price ?? 0,
              stock: 999,
            },
            item.quantity,
          );
        });
      }
    }

    // Reorder standalone products
    standalone.forEach((item) => {
      addToCart(
        {
          productId: item.productId,
          variantId: item.productId,
          name: item.productName || "Product",
          image: item.image || "",
          color: item.color || "",
          hexCode: item.hexCode || "",
          price: item.price ?? 0,
          stock: 999,
        },
        item.quantity,
      );
    });

    const totalItems = standalone.length + kitGroups.length;
    toast.success(
      t("purchased.toastReorderSuccess", undefined, { count: totalItems }),
    );
    navigate("/cart");
  };

  const handleCancelOrder = async () => {
    if (!cancelModal || !cancelModal.reason.trim()) return;
    setCancelling(true);
    try {
      await orderService.cancelOrder(cancelModal.orderId, {
        cancelReason: cancelModal.reason.trim(),
      });
      toast.success(t("purchased.cancelRequestSent"));
      setCancelModal(null);
      const { data: response } = await orderService.getMyOrders({
        page,
        limit: PAGE_SIZE,
      });
      setOrders(response.orders.map(normalizeOrder));
    } catch {
      toast.error(t("purchased.cancelRequestError"));
    } finally {
      setCancelling(false);
    }
  };

  const markAsDone = async (orderId: string) => {
    try {
      await orderService.updateOrderStatus(orderId, { orderStatus: "DELIVERED" });
      setOrders((prev) =>
        prev.map((o) =>
          o._id === orderId ? { ...o, orderStatus: "DELIVERED" as const } : o,
        ),
      );
      const doneOrder = orders.find((o) => o._id === orderId);
      if (doneOrder) {
        doneOrder.items.forEach((item) => {
          addNotification({
            type: "review_request",
            title: t("purchased.notificationTitle"),
            message: t("purchased.notificationMessage", {
              productName: item.productName,
              orderId,
            }),
            targetId: orderId,
            targetPath: "/purchased",
          });
        });
      }
      toast.success(t("purchased.toastMarkDoneSuccess"));
    } catch {
      toast.error(t("purchased.toastMarkDoneError"));
    }
  };

  /** Shared retry payment handler — works for VNPAY & MOMO */
  const handleRetryPayment = async (order: Order) => {
    setRetryingId(order._id);
    try {
      const { data } = await orderService.retryPayment(order._id);
      if (data.payUrl) {
        const methodLabel = order.payment.method === "MOMO" ? "MoMo" : "VNPay";
        toast.success(
          t("purchased.retryPaymentRedirect", { method: methodLabel }),
        );
        setTimeout(() => {
          window.location.href = data.payUrl;
        }, 500);
      } else {
        toast.error(t("purchased.retryPaymentError"));
      }
    } catch {
      toast.error(t("purchased.retryPaymentInitError"));
    } finally {
      setRetryingId(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "DELIVERED":
        return "✅";
      case "CONFIRMED":
      case "PREPARING":
      case "SHIPPING":
        return "✔️";
      case "PENDING":
        return "⏳";
      case "CANCELLED":
        return "❌";
      default:
        return "📦";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 pb-[calc(env(safe-area-inset-bottom)+72px)] md:pb-0">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="mb-2">{t("purchased.title")}</h1>
          <p className="text-muted-foreground">{t("purchased.subtitle")}</p>
          {total > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {t("purchased.showingOrders", undefined, {
                count: orders.length,
                total,
              })}
            </p>
          )}
        </div>

        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                <Package className="w-12 h-12 text-muted-foreground" />
              </div>
              <h3 className="mb-2">{t("purchased.noOrdersTitle")}</h3>
              <p className="text-muted-foreground mb-6">
                {t("purchased.noOrdersDesc")}
              </p>
              <Link
                to="/shop"
                className="inline-flex bg-primary text-primary-foreground px-8 py-3 rounded-full font-medium hover:bg-primary/90 transition-colors"
              >
                {t("purchased.browseShop")}
              </Link>
            </div>
          ) : (
            <>
              {orders.map((order) => (
                <Link
                  to={`/purchased/${order._id}`}
                  key={order._id}
                  className="block bg-card rounded-2xl p-6 border border-border hover:border-primary/30 transition-all hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">
                        {getStatusIcon(order.orderStatus)}
                      </span>
                      <div>
                        <h3 className="font-semibold">
                          {t("purchased.orderNumber", undefined, {
                            id: order._id.slice(-8).toUpperCase(),
                          })}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {new Date(order.createdAt).toLocaleDateString(
                            "vi-VN",
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary text-xl">
                        {formatPrice(order.totalPrice)}
                      </p>
                      <span
                        className={`badge ${getOrderStatusBadgeClass(order.orderStatus)}`}
                      >
                        {order.orderStatus}
                      </span>
                      {order.payment.status === "PAID" && (
                        <span className="badge badge-green text-[10px] mt-1">
                          {t("purchased.paid")}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-border pt-4">
                    <div className="space-y-3">
                      {(() => {
                        const { kitGroups, standalone } = groupItemsByKit(
                          order.items,
                        );
                        return (
                          <>
                            {/* Kit groups - only show after kit names are loaded */}
                            {kitNamesLoaded &&
                              kitGroups.map((group) => {
                                const kitName = kitNames[group.kitId];
                                if (!kitName) return null;
                                return (
                                  <div
                                    key={group.kitId}
                                    className="border border-primary/20 rounded-xl p-3 bg-primary/5"
                                  >
                                    <p className="text-xs font-semibold text-primary mb-2 uppercase tracking-wide">
                                      🎁 {kitName}
                                    </p>
                                    {group.items.map((item, idx) => {
                                      const reviewed = hasReviewed(
                                        order._id,
                                        item.productId,
                                      );
                                      return (
                                        <div
                                          key={idx}
                                          className="flex items-center justify-between py-1.5"
                                        >
                                          <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">
                                              {item.productName ||
                                                `Product ${item.productId}`}
                                            </p>
                                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                              <span>x{item.quantity}</span>
                                              {item.color && (
                                                <span>
                                                  {t(
                                                    "purchased.colorLabel",
                                                    undefined,
                                                    { color: item.color },
                                                  )}
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                                            {order.orderStatus ===
                                              "DELIVERED" &&
                                              !reviewed && (
                                                <button
                                                  onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    setReviewModal({
                                                      orderId: order._id,
                                                      productId: item.productId,
                                                      productName:
                                                        item.productName ||
                                                        "Product",
                                                    });
                                                  }}
                                                  className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full hover:bg-primary/20 transition-colors"
                                                >
                                                  <Star className="w-3 h-3 inline mr-1" />{" "}
                                                  {t("purchased.reviewButton")}
                                                </button>
                                              )}
                                            {order.orderStatus ===
                                              "DELIVERED" &&
                                              reviewed && (
                                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                  <Star className="w-3 h-3 fill-[var(--rating-star)] text-[var(--rating-star)]" />{" "}
                                                  {t("purchased.reviewedLabel")}
                                                </span>
                                              )}
                                            <ReportButton
                                              targetType="purchased_order"
                                              targetId={order._id}
                                              targetTitle={`Order ${order._id}`}
                                            />
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                );
                              })}
                            {/* Standalone items (no kitId) - show only variant info */}
                            {standalone.map((item, idx) => {
                              const reviewed = hasReviewed(
                                order._id,
                                item.productId,
                              );
                              return (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between"
                                >
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">
                                      {item.productName ||
                                        `Product ${item.productId}`}
                                    </p>
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                      <span>x{item.quantity}</span>
                                      {item.color && (
                                        <span className="flex items-center gap-1">
                                          {item.hexCode && (
                                            <span
                                              className="inline-block w-3 h-3 rounded-full border border-border"
                                              style={{
                                                backgroundColor: item.hexCode,
                                              }}
                                            />
                                          )}
                                          {item.color}
                                        </span>
                                      )}
                                      {item.price && (
                                        <span>{formatPrice(item.price)}</span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                                    {order.orderStatus === "DELIVERED" &&
                                      !reviewed && (
                                        <button
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setReviewModal({
                                              orderId: order._id,
                                              productId: item.productId,
                                              productName:
                                                item.productName || "Product",
                                            });
                                          }}
                                          className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full hover:bg-primary/20 transition-colors"
                                        >
                                          <Star className="w-3 h-3 inline mr-1" />{" "}
                                          {t("purchased.reviewButton")}
                                        </button>
                                      )}
                                    {order.orderStatus === "DELIVERED" &&
                                      reviewed && (
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                          <Star className="w-3 h-3 fill-[var(--rating-star)] text-[var(--rating-star)]" />{" "}
                                          {t("purchased.reviewedLabel")}
                                        </span>
                                      )}
                                    <ReportButton
                                      targetType="purchased_order"
                                      targetId={order._id}
                                      targetTitle={`Order ${order._id}`}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </>
                        );
                      })()}
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      {/* ── Retry payment for PENDING + unpaid orders (VNPAY / MOMO) ── */}
                      {order.orderStatus === "PENDING" &&
                        order.payment.status === "PENDING" &&
                        !order.isCancelRequested && (
                          <button
                            onClick={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              await handleRetryPayment(order);
                            }}
                            disabled={retryingId === order._id}
                            className="text-xs bg-primary text-primary-foreground px-4 py-2 rounded-full hover:bg-primary/90 transition-colors"
                          >
                            {retryingId === order._id
                              ? "..."
                              : `${t("purchased.retryPayment")}`}
                          </button>
                        )}
                      {/* ── Cancel button for PENDING orders (only if not unpaid VNPAY/MOMO) ── */}
                      {order.orderStatus === "PENDING" &&
                        !order.isCancelRequested &&
                        order.payment.status !== "PENDING" && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setCancelModal({
                                orderId: order._id,
                                reason: "",
                              });
                            }}
                            className="text-xs bg-destructive/10 text-destructive px-4 py-2 rounded-full hover:bg-destructive/20 transition-colors"
                          >
                            <XCircle className="w-3 h-3 inline mr-1" />{" "}
                            {t("purchased.cancelOrder")}
                          </button>
                        )}
                      {order.isCancelRequested &&
                        order.orderStatus === "PENDING" && (
                          <span className="badge badge-orange text-[10px] mt-1">
                            ⏳ {t("purchased.cancelPending")}
                          </span>
                        )}
                      {order.orderStatus === "SHIPPING" && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            markAsDone(order._id);
                          }}
                          className="text-xs bg-secondary text-secondary-foreground px-4 py-2 rounded-full hover:bg-secondary/90 transition-colors"
                        >
                          ✅ {t("purchased.markAsDone")}
                        </button>
                      )}
                      {/* ── Retry payment for CANCELLED orders (VNPAY / MOMO) ── */}
                      {order.orderStatus === "CANCELLED" &&
                        (order.payment.method === "VNPAY" ||
                          order.payment.method === "MOMO") &&
                        order.payment.status !== "PAID" && (
                          <button
                            onClick={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              await handleRetryPayment(order);
                            }}
                            disabled={retryingId === order._id}
                            className="text-xs bg-primary text-primary-foreground px-4 py-2 rounded-full hover:bg-primary/90 transition-colors"
                          >
                            {retryingId === order._id
                              ? "..."
                              : `${t("purchased.retryPayment")}`}
                          </button>
                        )}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleReorder(order);
                        }}
                        className="text-xs bg-primary text-primary-foreground px-4 py-2 rounded-full hover:bg-primary/90 transition-colors"
                      >
                        <ShoppingCart className="w-3 h-3 inline mr-1" />{" "}
                        {t("purchased.reorderButton")}
                      </button>
                    </div>
                  </div>
                </Link>
              ))}

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 pt-6 pb-4">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="flex items-center gap-1 px-4 py-2 rounded-full text-sm font-medium border border-border bg-card hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    {t("purchased.previousButton")}
                  </button>
                  <span className="text-sm text-muted-foreground">
                    {t("purchased.pageInfo", undefined, { page, totalPages })}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="flex items-center gap-1 px-4 py-2 rounded-full text-sm font-medium border border-border bg-card hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {t("purchased.nextButton")}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Cancel Modal */}
      {cancelModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setCancelModal(null)}
        >
          <div
            className="bg-card rounded-2xl border border-border shadow-xl max-w-md w-full mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold mb-1">
              {t("purchased.cancelModalTitle")}
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              {t("purchased.cancelModalDesc")}
            </p>
            <textarea
              value={cancelModal.reason}
              onChange={(e) =>
                setCancelModal({ ...cancelModal, reason: e.target.value })
              }
              placeholder={t("purchased.cancelModalPlaceholder")}
              rows={3}
              className="w-full px-3 py-2.5 bg-input-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setCancelModal(null)}
                className="flex-1 py-2.5 rounded-full text-sm border border-border hover:bg-muted transition-colors"
              >
                {t("purchased.cancelModalBack")}
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={cancelling || !cancelModal.reason.trim()}
                className="flex-1 py-2.5 rounded-full text-sm font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50"
              >
                {cancelling
                  ? t("purchased.cancelModalSubmitting")
                  : t("purchased.cancelModalSubmit")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setReviewModal(null)}
        >
          <div
            className="bg-card rounded-2xl border border-border shadow-xl max-w-md w-full mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold mb-1">
              {t("purchased.reviewModalTitle")}
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              {reviewModal.productName}
            </p>
            <div className="flex items-center gap-2 mb-4">
              {Array.from({ length: 5 }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setRating(i + 1)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${i < rating ? "fill-[var(--rating-star)] text-[var(--rating-star)]" : "text-muted-foreground/30"}`}
                  />
                </button>
              ))}
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t("purchased.reviewModalPlaceholder")}
              rows={3}
              className="w-full px-3 py-2.5 bg-input-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setReviewModal(null)}
                className="flex-1 py-2.5 rounded-full text-sm border border-border hover:bg-muted transition-colors"
              >
                {t("purchased.cancelButton")}
              </button>
              <button
                onClick={handleSubmitReview}
                disabled={!comment.trim()}
                className="flex-1 py-2.5 rounded-full text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {t("purchased.submitReview")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
