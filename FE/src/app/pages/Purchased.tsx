import { useState, useEffect, useMemo, useRef } from "react";
import {
  Package,
  PackageCheck,
  PackageOpen,
  Calendar,
  Check,
  Clock,
  Star,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Scissors,
  XCircle,
  Truck,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "../../lib/formatPrice";
import { formatExpectedDelivery, isAwaitingDelivery } from "../../lib/orderDelivery";
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
import { normalizeOrder, isCourseItem } from "../../features/orders/types/order.types";
import { getOrderStatusBadgeClass, ORDER_STATUS_LABELS } from "../../constants/orderStatus";
import { useLanguage } from "../../shared/contexts/LanguageContext";
import { OrderThread } from "../../shared/components/order/OrderThread";
import { EmptyHoopIllustration } from "./shop/CartPage";
import { useMembershipStore } from "../../features/membership/store/membership.store";
import "../../styles/purchased.css";

const PAGE_SIZE = 10;

export function Purchased() {
  const { t } = useLanguage();
  const { user, refreshProfile } = useAuth();
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
  const [kitNames, setKitNames] = useState<Record<string, string>>({});
  const [kitNamesLoaded, setKitNamesLoaded] = useState(false);
  const { addToCart, addKitToCart } = useCart();
  const navigate = useNavigate();

  // After paying, the backend webhook may have granted course purchases.
  // Refresh the profile once per page visit so purchasedCourses/enrolled stay
  // up to date. (useAuth user is recreated on each setUser, so guard with a ref.)
  const refreshedOnce = useRef(false);
  useEffect(() => {
    if (!user || refreshedOnce.current) return;
    refreshedOnce.current = true;
    void refreshProfile();
  }, [user, refreshProfile]);

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
      // Course purchases are digital — they cannot be re-added to the cart
      if (isCourseItem(item)) return;
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
      // Huỷ đơn → BE hoàn coin đã dùng + đổi history sang "cancelled".
      void useMembershipStore.getState().refresh();
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

  /** Map order status -> icon + màu vòng tròn (dùng token success/warning/error/info sẵn có) */
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "DELIVERED":
      case "PROCESSED":
        return { Icon: PackageCheck, tone: "is-success" };
      case "CONFIRMED":
        return { Icon: Check, tone: "is-info" };
      case "PREPARING":
        return { Icon: PackageOpen, tone: "is-info" };
      case "SHIPPING":
        return { Icon: Truck, tone: "is-info" };
      case "PENDING":
        return { Icon: Clock, tone: "is-warning" };
      case "CANCELLED":
      case "REJECTED":
        return { Icon: Scissors, tone: "is-error" };
      default:
        return { Icon: Package, tone: "is-neutral" };
    }
  };

  /** 1 dòng sản phẩm dùng chung cho cả hàng trong kit lẫn hàng standalone */
  const renderItemRow = (
    item: OrderItem,
    order: Order,
    idx: number | string,
  ) => {
    const reviewed = hasReviewed(order._id, item.productId);
    const lineTotal = (item.price ?? 0) * item.quantity;

    return (
      <div key={idx} className="purchased-item-row">
        <div className="purchased-item-thumb">
          {item.image ? (
            <img
              src={item.image}
              alt={item.productName || "Product"}
              loading="lazy"
            />
          ) : (
            <Package className="w-5 h-5 text-muted-foreground" />
          )}
        </div>

        <div className="purchased-item-info">
          <p className="purchased-item-name">
            {item.productName || `Product ${item.productId}`}
          </p>
          <div className="purchased-item-meta">
            <span className="purchased-qty-chip">x{item.quantity}</span>
            {item.color && (
              <span>
                {item.hexCode && (
                  <span
                    className="purchased-color-dot"
                    style={{ backgroundColor: item.hexCode }}
                  />
                )}
                {item.color}
              </span>
            )}
          </div>
          {(order.orderStatus === "DELIVERED" && !isCourseItem(item)) && (
            <div className="purchased-item-review-row">
              {!reviewed ? (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setReviewModal({
                      orderId: order._id,
                      productId: item.productId,
                      productName: item.productName || "Product",
                    });
                  }}
                  className="purchased-review-btn"
                >
                  <Star className="w-3 h-3" /> {t("purchased.reviewButton")}
                </button>
              ) : (
                <span className="purchased-reviewed-label">
                  <Star className="w-3 h-3 fill-[var(--rating-star)] text-[var(--rating-star)]" />
                  {t("purchased.reviewedLabel")}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="purchased-item-price">
          {item.price != null ? (
            <>
              <span className="line-total">{formatPrice(lineTotal)}</span>
              {item.quantity > 1 && (
                <span className="unit-price">
                  {formatPrice(item.price)} / 1
                </span>
              )}
            </>
          ) : (
            <span className="line-total">—</span>
          )}
        </div>

        <div
          className="purchased-report-cell"
          onClick={(e) => e.stopPropagation()}
        >
          <ReportButton
            targetType="purchased_order"
            targetId={order._id}
            targetTitle={`Order ${order._id}`}
          />
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="purchased-skeleton h-10 w-64 mb-3" />
          <div className="purchased-skeleton h-5 w-96 max-w-full mb-10" />
          {[0, 1, 2].map((i) => (
            <div key={i} className="purchased-skeleton h-52 w-full mb-5 rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 pb-[calc(env(safe-area-inset-bottom)+72px)] md:pb-12">
      <div className="max-w-4xl mx-auto">
        {/* ── Hero: tiêu đề kiểu sổ tay thủ công ── */}
        <header className="purchased-hero">
          <div className="min-w-0">
            <p className="purchased-eyebrow">Góc len của bạn</p>
            <h1 className="purchased-title">{t("purchased.title")}</h1>
            <div className="purchased-title-stitch" aria-hidden />
            <p className="purchased-subtitle">{t("purchased.subtitle")}</p>
          </div>
          {total > 0 && (
            <div className="purchased-hero-count">
              <span className="purchased-hero-count-num">{total}</span>
              <span className="purchased-hero-count-label">đơn hàng</span>
            </div>
          )}
        </header>

        {orders.length === 0 ? (
          <div className="purchased-empty">
            <EmptyHoopIllustration size={170} />
            <h2 className="purchased-empty-title">{t("purchased.noOrdersTitle")}</h2>
            <p className="purchased-empty-desc">{t("purchased.noOrdersDesc")}</p>
            <Link to="/shop" className="purchased-empty-btn">
              {t("purchased.browseShop")}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {orders.map((order, orderIdx) => {
              const { Icon: StatusIcon, tone } = getStatusIcon(order.orderStatus);
              const { kitGroups, standalone } = groupItemsByKit(order.items);
              const expected =
                isAwaitingDelivery(order.orderStatus) &&
                formatExpectedDelivery(order.expectedDeliveryTime);

              return (
                <Link
                  to={`/purchased/${order._id}`}
                  key={order._id}
                  className="purchased-card"
                  style={{ animationDelay: `${Math.min(orderIdx, 6) * 50}ms` }}
                >
                  {/* ── Header: mã đơn + trạng thái ── */}
                  <div className="purchased-card-header">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`purchased-status-icon ${tone}`}>
                        <StatusIcon className="w-[18px] h-[18px]" />
                      </span>
                      <div className="min-w-0">
                        <h3 className="purchased-order-id truncate">
                          {t("purchased.orderNumber", undefined, {
                            id: order._id.slice(-8).toUpperCase(),
                          })}
                        </h3>
                        <div className="purchased-order-meta">
                          <span>
                            <Calendar className="w-3 h-3" />
                            {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                          </span>
                          <span>
                            <Package className="w-3 h-3" />
                            {order.items.length} sản phẩm
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-1.5 flex-wrap flex-shrink-0">
                      {order.payment.status === "PAID" && (
                        <span className="badge badge-green text-[10px]">
                          {t("purchased.paid")}
                        </span>
                      )}
                      <span className={`badge ${getOrderStatusBadgeClass(order.orderStatus)}`}>
                        {ORDER_STATUS_LABELS[order.orderStatus] ?? order.orderStatus}
                      </span>
                    </div>
                  </div>

                  {/* ── Sợi chỉ tiến trình ── */}
                  <div className="purchased-card-thread">
                    <OrderThread status={order.orderStatus} compact />
                    {expected && (
                      <p className="purchased-expected">
                        <Truck className="w-3.5 h-3.5" />
                        Dự kiến nhận hàng: <strong>{expected}</strong>
                      </p>
                    )}
                  </div>

                  {/* ── Danh sách sản phẩm ── */}
                  <div className="purchased-card-body">
                    {kitNamesLoaded &&
                      kitGroups.map((group) => {
                        const kitName = kitNames[group.kitId];
                        if (!kitName) return null;
                        return (
                          <div key={group.kitId} className="purchased-kit-group">
                            <div className="purchased-kit-header">
                              <span className="purchased-kit-icon">
                                <PackageOpen className="w-3.5 h-3.5" />
                              </span>
                              <p className="purchased-kit-title">{kitName}</p>
                            </div>
                            {group.items.map((item, idx) =>
                              renderItemRow(item, order, `${group.kitId}-${idx}`),
                            )}
                          </div>
                        );
                      })}
                    {standalone.map((item, idx) => renderItemRow(item, order, idx))}
                  </div>

                  {/* ── Footer: tổng tiền + hành động ── */}
                  <div className="purchased-card-footer">
                    <div className="purchased-total">
                      <span className="purchased-total-label">Tổng cộng</span>
                      <span className="purchased-total-value">
                        {formatPrice(order.totalPrice)}
                      </span>
                    </div>

                    <div className="purchased-actions">
                      {order.isCancelRequested && order.orderStatus === "PENDING" && (
                        <span className="badge badge-orange text-[10px]">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {t("purchased.cancelPending")}
                        </span>
                      )}
                      {order.orderStatus === "PENDING" && !order.isCancelRequested && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setCancelModal({ orderId: order._id, reason: "" });
                          }}
                          className="purchased-action-btn is-danger"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          {t("purchased.cancelOrder")}
                        </button>
                      )}
                      {order.orderStatus === "SHIPPING" && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            markAsDone(order._id);
                          }}
                          className="purchased-action-btn is-soft"
                        >
                          <PackageCheck className="w-3.5 h-3.5" />
                          {t("purchased.markAsDone")}
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleReorder(order);
                        }}
                        className="purchased-action-btn is-primary"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        {t("purchased.reorderButton")}
                      </button>
                    </div>
                  </div>
                </Link>
              );
            })}

            {totalPages > 1 && (
              <nav className="purchased-pagination" aria-label="Phân trang">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="purchased-page-btn"
                >
                  <ChevronLeft className="w-4 h-4" />
                  {t("purchased.previousButton")}
                </button>
                <span className="purchased-page-info">
                  {t("purchased.pageInfo", undefined, { page, totalPages })}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="purchased-page-btn"
                >
                  {t("purchased.nextButton")}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </nav>
            )}
          </div>
        )}
      </div>

      {/* Cancel Modal */}
      {cancelModal && (
        <div
          className="order-modal-overlay"
          onClick={() => setCancelModal(null)}
        >
          <div
            className="order-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="order-modal-title">
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
          className="order-modal-overlay"
          onClick={() => setReviewModal(null)}
        >
          <div
            className="order-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="order-modal-title">
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