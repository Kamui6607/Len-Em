// ============================================================
// DIYDetailPage — route /diy/:postId
// Một dự án DIY: ảnh, câu chuyện của creator, nguyên liệu đúng như creator
// đã chọn (biến thể + số lượng), mua lẻ / mua trọn bộ, lưu, chia sẻ, chấm sao.
//  - Nguyên liệu: linkedProduct mang { productId, variantId, quantity } —
//    dùng đúng biến thể creator chọn (trước đây luôn lấy variants[0]).
//    Biến thể đó hết / bị xoá → rơi về màu còn hàng đầu tiên và ghi chú lại.
//  - "Thêm DIY vào giỏ": mua CHÍNH bài DIY (title / description / images /
//    price của bài). Nguyên liệu bên dưới chỉ để tham khảo, mua riêng ở trang
//    sản phẩm / combo.
//  - Bài chưa duyệt / bị từ chối chỉ creator (và admin/staff) xem được.
// ============================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  AlertTriangle,
  ArrowLeft,
  Minus,
  Plus,
  Bookmark,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flame,
  Heart,
  ImageOff,
  Link2,
  Package,
  RotateCcw,
  Share2,
  ShoppingBag,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "../../shared/components/ui/avatar";
import { useAuth } from "../../shared/hooks/useAuth";
import { useFavorites } from "../../shared/contexts/FavoritesContext";
import { diyService } from "../../features/diy/services/diy.service";
import type { DIYCreator, DIYPost } from "../../features/diy/types/diy.types";
import { useAddToCart } from "../../features/cart/useAddToCart";
import {
  loadDIYMaterials,
  toDIYCartPayload,
  type MaterialKit,
  type MaterialProduct,
} from "../../features/diy/diyMaterials";
import {
  getValidHex,
  getVariantLabel,
  isDefaultVariant,
} from "../../shared/components/ProductVariantSelector";
import { formatPrice } from "../../lib/formatPrice";
import { toId } from "../../lib/displayText";
import { resolveAvatarUrl } from "../../lib/avatarUrl";
import "../../styles/diy-detail.css";

type LoadState = "loading" | "ready" | "notfound" | "error" | "hidden";

const DESCRIPTION_CLAMP = 360;

function creatorOf(post: DIYPost): DIYCreator | undefined {
  return post.creatorId && typeof post.creatorId === "object" ? post.creatorId : undefined;
}

function formatDate(value?: string) {
  const d = value ? new Date(value) : null;
  return d && !Number.isNaN(d.getTime())
    ? d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
    : "";
}

export function DIYDetailPage() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { isDIYPostSaved, toggleDIYPostSave } = useFavorites();
  const { addDIY } = useAddToCart();
  const [qty, setQty] = useState(1);

  const [post, setPost] = useState<DIYPost | null>(null);
  const [state, setState] = useState<LoadState>("loading");
  const [materials, setMaterials] = useState<MaterialProduct[]>([]);
  const [kits, setKits] = useState<MaterialKit[]>([]);
  const [materialsLoading, setMaterialsLoading] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [hoverScore, setHoverScore] = useState(0);
  const [rating, setRating] = useState(false);

  const isStaff = user?.roleId === "admin" || user?.roleId === "staff";

  const loadPost = useCallback(async () => {
    if (!postId) return;
    setState("loading");
    try {
      const { data } = await diyService.getPostById(postId);
      const loaded = data.data?.post ?? null;
      if (!loaded) {
        setState("notfound");
        return;
      }
      setPost(loaded);
      setActiveImage(0);
      setState("ready");
    } catch (error) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      setState(status === 404 || status === 400 ? "notfound" : "error");
    }
  }, [postId]);

  useEffect(() => {
    void loadPost();
  }, [loadPost]);

  // Bài chưa duyệt / bị từ chối: chỉ creator + admin/staff.
  const creator = post ? creatorOf(post) : undefined;
  const isOwner = Boolean(user && creator && toId(creator._id) === user.userId);
  const status = (post?.status || "").toLowerCase();
  const hiddenFromViewer = Boolean(post) && status !== "done" && !isOwner && !isStaff;

  // Nguyên liệu: tải song song sản phẩm + combo.
  useEffect(() => {
    if (!post || hiddenFromViewer) return;
    let cancelled = false;
    setMaterialsLoading(true);
    loadDIYMaterials(post).then(({ products: productList, kits: kitList }) => {
      if (cancelled) return;
      setMaterials(productList);
      setKits(kitList);
      setMaterialsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [post?._id, hiddenFromViewer]); // eslint-disable-line react-hooks/exhaustive-deps

  const images = useMemo(() => (post?.images ?? []).filter(Boolean), [post]);
  const imageCount = images.length;
  const go = (delta: number) => setActiveImage((i) => (imageCount ? (i + delta + imageCount) % imageCount : 0));

  const materialCount = materials.length + kits.length;
  const diyPrice = Math.max(0, Number(post?.price) || 0);

  const requireAuth = (action: () => void) => {
    if (!isAuthenticated) {
      navigate("/auth/login");
      return;
    }
    action();
  };

  // Mua chính bài DIY — không phải nguyên liệu của nó.
  const addDIYToCart = () =>
    requireAuth(() => {
      if (post) addDIY(toDIYCartPayload(post), qty);
    });

  const save = () =>
    requireAuth(() => {
      if (!post) return;
      const wasSaved = isDIYPostSaved(post._id);
      toggleDIYPostSave(post._id);
      toast.success(wasSaved ? "Đã bỏ lưu dự án" : "Đã lưu dự án — xem lại trong mục đã lưu");
    });

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: post?.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success("Đã sao chép liên kết dự án");
    } catch {
      // Người dùng huỷ chia sẻ / clipboard bị chặn — không cần báo
    }
  };

  const myScore = post?.ratings?.find((r) => toId(r.userId) === user?.userId)?.score ?? 0;
  const ratingCount = post?.ratings?.length ?? 0;

  const rate = (score: number) =>
    requireAuth(async () => {
      if (!post || rating) return;
      setRating(true);
      try {
        const { data } = await diyService.ratePost(post._id, score);
        const updated = data.data?.post;
        // Bài trả về không populate creator → chỉ ghép phần đánh giá.
        setPost((current) =>
          current
            ? {
                ...current,
                ratings: updated?.ratings ?? current.ratings,
                averageRating: updated?.averageRating ?? current.averageRating,
              }
            : current,
        );
        toast.success(myScore ? "Đã cập nhật đánh giá" : "Cảm ơn bạn đã đánh giá!");
      } catch {
        toast.error("Không gửi được đánh giá. Vui lòng thử lại.");
      } finally {
        setRating(false);
      }
    });

  // ── Trạng thái tải / lỗi ──
  if (state === "loading") {
    return (
      <div className="dd-page">
        <div className="dd-wrap" aria-busy="true" aria-label="Đang tải dự án">
          <div className="dd-skel h-5 w-28" />
          <div className="dd-layout mt-6">
            <div className="dd-skel aspect-[4/5] rounded-[28px]" />
            <div className="grid content-start gap-4">
              <div className="dd-skel h-6 w-40" />
              <div className="dd-skel h-12 w-full" />
              <div className="dd-skel h-10 w-56" />
              <div className="dd-skel h-32 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (state !== "ready" || !post || hiddenFromViewer) {
    const isError = state === "error";
    return (
      <div className="dd-page">
        <div className="dd-wrap">
          <div className="dd-empty">
            <span className="dd-empty-mark" aria-hidden="true">
              {isError ? <RotateCcw className="size-8" /> : <ImageOff className="size-8" />}
            </span>
            <h1 className="dd-empty-title">
              {isError ? "Không tải được dự án" : hiddenFromViewer ? "Dự án chưa được công khai" : "Không tìm thấy dự án"}
            </h1>
            <p className="dd-empty-desc">
              {isError
                ? "Kết nối có trục trặc. Bạn thử tải lại nhé."
                : hiddenFromViewer
                  ? "Dự án này đang chờ duyệt hoặc đã bị gỡ, nên chưa thể xem."
                  : "Dự án có thể đã bị xoá hoặc đường dẫn không đúng."}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {isError && (
                <button type="button" className="dd-btn is-primary" onClick={() => void loadPost()}>
                  <RotateCcw className="size-4" />
                  Thử lại
                </button>
              )}
              <Link to="/diy" className={`dd-btn ${isError ? "is-ghost" : "is-primary"}`}>
                Khám phá dự án khác
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const saved = isDIYPostSaved(post._id);
  const description = post.description || "";
  const longDescription = description.length > DESCRIPTION_CLAMP;
  const average = post.averageRating ?? 0;
  const shownScore = hoverScore || myScore;

  return (
    <div className="dd-page">
      <div className="dd-wrap">
        <Link to="/diy" className="dd-back">
          <ArrowLeft className="size-4" />
          Góc DIY
        </Link>

        {status !== "done" && (
          <div className={`dd-banner ${status === "cancel" ? "is-cancel" : "is-pending"}`} role="status">
            {status === "cancel" ? <AlertTriangle className="size-4" /> : <Clock className="size-4" />}
            {status === "cancel"
              ? "Dự án này đã bị từ chối nên không hiển thị công khai."
              : "Dự án đang chờ duyệt — chỉ bạn và quản trị viên nhìn thấy trang này."}
          </div>
        )}

        <div className="dd-layout">
          {/* ── Ảnh ── */}
          <section className="dd-gallery" aria-label="Ảnh dự án">
            <div
              className="dd-stage"
              tabIndex={imageCount > 1 ? 0 : -1}
              onKeyDown={(e) => {
                if (e.key === "ArrowLeft") go(-1);
                if (e.key === "ArrowRight") go(1);
              }}
            >
              {imageCount > 0 ? (
                <img src={images[activeImage]} alt={`${post.title} — ảnh ${activeImage + 1}`} />
              ) : (
                <span className="dd-stage-empty">
                  <ImageOff className="size-10" />
                  Chưa có ảnh
                </span>
              )}
              {imageCount > 1 && (
                <>
                  <button type="button" className="dd-nav is-prev" onClick={() => go(-1)} aria-label="Ảnh trước">
                    <ChevronLeft className="size-5" />
                  </button>
                  <button type="button" className="dd-nav is-next" onClick={() => go(1)} aria-label="Ảnh sau">
                    <ChevronRight className="size-5" />
                  </button>
                  <span className="dd-counter">
                    {activeImage + 1}/{imageCount}
                  </span>
                </>
              )}
            </div>
            {imageCount > 1 && (
              <div className="dd-thumbs" role="tablist" aria-label="Chọn ảnh">
                {images.map((src, i) => (
                  <button
                    key={`${src}-${i}`}
                    type="button"
                    role="tab"
                    aria-selected={i === activeImage}
                    aria-label={`Ảnh ${i + 1}`}
                    className="dd-thumb"
                    onClick={() => setActiveImage(i)}
                  >
                    <img src={src} alt="" />
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* ── Thông tin ── */}
          <section className="dd-info" aria-labelledby="dd-title">
            {post.tags?.length > 0 && (
              <div className="dd-tags">
                {post.tags.map((tag) => (
                  <Link key={tag} to={`/diy?search=${encodeURIComponent(tag)}`} className="dd-tag">
                    #{tag}
                  </Link>
                ))}
              </div>
            )}
            <h1 id="dd-title" className="dd-title">
              {post.title}
            </h1>
            <div className="dd-stitch" aria-hidden />

            <div className="dd-creator">
              <Avatar className="size-10">
                <AvatarImage src={resolveAvatarUrl(creator?.avatar)} alt={creator?.fullName} />
                <AvatarFallback>{creator?.fullName?.charAt(0) || "C"}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="dd-creator-name">
                  {creator?.fullName || creator?.username || "Creator"}
                  {isOwner && <span className="dd-you">Bạn</span>}
                </p>
                <p className="dd-creator-date">Đăng ngày {formatDate(post.createdAt)}</p>
              </div>
            </div>

            <ul className="dd-stats" aria-label="Thống kê">
              <li>
                <Star className="size-4" />
                <b>{average ? average.toFixed(1) : "—"}</b>
                <span>{ratingCount ? `${ratingCount} đánh giá` : "chưa có đánh giá"}</span>
              </li>
              <li>
                <Heart className="size-4" />
                <b>{(post.likeCount ?? 0).toLocaleString("vi-VN")}</b>
                <span>yêu thích</span>
              </li>
              {(post.purchaseCount ?? 0) > 0 && (
                <li>
                  <Flame className="size-4" />
                  <b>{post.purchaseCount.toLocaleString("vi-VN")}</b>
                  <span>đã mua</span>
                </li>
              )}
            </ul>

            <div className={`dd-desc${longDescription && !expanded ? " is-clamped" : ""}`}>{description}</div>
            {longDescription && (
              <button type="button" className="dd-more" onClick={() => setExpanded((v) => !v)} aria-expanded={expanded}>
                {expanded ? "Thu gọn" : "Xem thêm"}
                <ChevronDown className={`size-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
              </button>
            )}

            <div className="dd-actions">
              <button type="button" className={`dd-btn is-ghost${saved ? " is-saved" : ""}`} onClick={save} aria-pressed={saved}>
                <Bookmark className="size-4" />
                {saved ? "Đã lưu" : "Lưu dự án"}
              </button>
              <button type="button" className="dd-btn is-ghost" onClick={share}>
                {typeof navigator !== "undefined" && "share" in navigator ? <Share2 className="size-4" /> : <Link2 className="size-4" />}
                Chia sẻ
              </button>
            </div>

            {/* Mua bài DIY */}
            <div className="dd-bundle">
              <div className="dd-bundle-head">
                <span>
                  Mua DIY này
                  <small>{diyPrice > 0 ? `${formatPrice(diyPrice)} / DIY` : "Miễn phí"}</small>
                </span>
                <strong>{diyPrice > 0 ? formatPrice(diyPrice * qty) : "Miễn phí"}</strong>
              </div>
              <div className="dd-bundle-row">
                <div className="dd-stepper" role="group" aria-label="Số lượng DIY">
                  <button
                    type="button"
                    onClick={() => setQty((n) => Math.max(1, n - 1))}
                    disabled={qty <= 1}
                    aria-label="Giảm số lượng"
                  >
                    <Minus className="size-3.5" />
                  </button>
                  <output aria-live="polite">{qty}</output>
                  <button
                    type="button"
                    onClick={() => setQty((n) => Math.min(99, n + 1))}
                    disabled={qty >= 99}
                    aria-label="Tăng số lượng"
                  >
                    <Plus className="size-3.5" />
                  </button>
                </div>
                <button
                  type="button"
                  className="dd-btn is-primary flex-1"
                  onClick={addDIYToCart}
                  disabled={status !== "done"}
                >
                  <ShoppingBag className="size-4" />
                  Thêm DIY vào giỏ
                </button>
              </div>
              {status !== "done" && <p className="dd-bundle-note">Dự án chưa được duyệt nên chưa thể mua.</p>}
            </div>
          </section>
        </div>

        {/* ── Nguyên liệu ── */}
        <section className="dd-section" aria-labelledby="dd-materials">
          <div className="dd-section-head">
            <h2 id="dd-materials" className="dd-section-title">
              Nguyên liệu creator đã dùng
            </h2>
            <p className="dd-section-sub">Tham khảo — đúng màu và số lượng creator dùng. Bấm vào món để xem và mua riêng.</p>
          </div>

          {materialsLoading ? (
            <div className="dd-materials">
              {Array.from({ length: Math.max(2, Math.min(materialCount, 4)) }).map((_, i) => (
                <div key={i} className="dd-skel h-[104px] rounded-[20px]" />
              ))}
            </div>
          ) : materialCount === 0 ? (
            <div className="dd-none">Creator chưa gắn nguyên liệu nào cho dự án này.</div>
          ) : (
            <ul className="dd-materials">
              {materials.map((m) => (
                <MaterialRow key={m.key} material={m} />
              ))}
              {kits.map((k) => (
                <KitRow key={k.key} item={k} />
              ))}
            </ul>
          )}
        </section>

        {/* ── Đánh giá ── */}
        {status === "done" && !isOwner && (
          <section className="dd-rate" aria-labelledby="dd-rate-title">
            <div>
              <h2 id="dd-rate-title" className="dd-section-title">
                Bạn thấy dự án này thế nào?
              </h2>
              <p className="dd-section-sub">
                {myScore ? `Bạn đã chấm ${myScore} sao — bấm để đổi.` : "Chấm sao giúp người khác chọn dự án phù hợp."}
              </p>
            </div>
            <div className="dd-stars" role="radiogroup" aria-label="Chấm điểm" onMouseLeave={() => setHoverScore(0)}>
              {[1, 2, 3, 4, 5].map((score) => (
                <button
                  key={score}
                  type="button"
                  role="radio"
                  aria-checked={myScore === score}
                  aria-label={`${score} sao`}
                  className={`dd-star${score <= shownScore ? " is-on" : ""}`}
                  onMouseEnter={() => setHoverScore(score)}
                  onFocus={() => setHoverScore(score)}
                  onBlur={() => setHoverScore(0)}
                  onClick={() => rate(score)}
                  disabled={rating}
                >
                  <Star className="size-7" />
                </button>
              ))}
            </div>
          </section>
        )}
      </div>

    </div>
  );
}

// ── Một nguyên liệu (sản phẩm) ──
function MaterialRow({ material: m }: { material: MaterialProduct }) {
  const v = m.variant;
  const hex = v && !isDefaultVariant(v) ? getValidHex(v.hexCode) : undefined;
  const showColor = v && !isDefaultVariant(v);
  const image = v?.images?.[0] || m.product?.image;

  return (
    <li className={`dd-mat${m.unavailable ? " is-off" : ""}`}>
      <Link to={`/shop/product/${m.productId}`} className="dd-mat-thumb" tabIndex={-1} aria-hidden="true">
        {image ? <img src={image} alt="" /> : <Package className="size-6" />}
        {m.quantity > 1 && <span className="dd-mat-qty">×{m.quantity}</span>}
      </Link>
      <div className="min-w-0 flex-1">
        {m.product ? (
          <Link to={`/shop/product/${m.productId}`} className="dd-mat-name">
            {m.product.name}
          </Link>
        ) : (
          <p className="dd-mat-name">Sản phẩm không còn tồn tại</p>
        )}
        <div className="dd-mat-meta">
          {showColor && (
            <span className="dd-chip">
              {hex && <span className="dd-swatch" style={{ background: hex }} aria-hidden="true" />}
              {getVariantLabel(v!)}
            </span>
          )}
          <span>SL {m.quantity}</span>
          {v && !m.unavailable && <span className="dd-mat-unit">{formatPrice(v.price)}/cái</span>}
        </div>
        {m.unavailable ? (
          <p className="dd-mat-warn">{m.product && m.product.isActive !== false ? "Đã hết hàng" : "Ngừng bán"}</p>
        ) : m.substituted ? (
          <p className="dd-mat-warn is-soft">Màu creator dùng đã hết — đang gợi ý {v ? getVariantLabel(v) : "màu khác"}.</p>
        ) : null}
      </div>
      <div className="dd-mat-side">
        {v && !m.unavailable && <span className="dd-mat-total">{formatPrice(v.price * m.quantity)}</span>}
      </div>
    </li>
  );
}

// ── Một combo ──
function KitRow({ item }: { item: MaterialKit }) {
  const kit = item.kit;
  return (
    <li className={`dd-mat is-kit${item.unavailable ? " is-off" : ""}`}>
      <Link to={`/kits/${item.kitId}`} className="dd-mat-thumb" tabIndex={-1} aria-hidden="true">
        {kit?.thumbnail ? <img src={kit.thumbnail} alt="" /> : <Package className="size-6" />}
        <span className="dd-mat-tag">Combo</span>
      </Link>
      <div className="min-w-0 flex-1">
        {kit ? (
          <Link to={`/kits/${item.kitId}`} className="dd-mat-name">
            {kit.name}
          </Link>
        ) : (
          <p className="dd-mat-name">Combo không còn tồn tại</p>
        )}
        {kit && (
          <div className="dd-mat-meta">
            <span className="dd-chip is-kit">
              <Package className="size-3" aria-hidden="true" />
              {kit.products?.length ?? 0} món
            </span>
          </div>
        )}
        {item.unavailable && <p className="dd-mat-warn">Ngừng bán</p>}
      </div>
      <div className="dd-mat-side">
        {kit && !item.unavailable && <span className="dd-mat-total">{formatPrice(kit.price)}</span>}
      </div>
    </li>
  );
}
