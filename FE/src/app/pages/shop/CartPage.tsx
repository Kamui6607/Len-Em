// ============================================================
// Cart Page — route /cart
// Items (products + combos) on the left, order summary on the right;
// on mobile the summary stacks below and a checkout bar floats above
// the tab bar until the summary's own button is on screen.
// ============================================================

import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Heart,
  Lock,
  Minus,
  Package,
  Plus,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  useCart,
  type CartDIYItem,
  type CartItem,
  type CartKitItem,
} from "../../../shared/contexts/CartContext";
import { useLanguage } from "../../../shared/contexts/LanguageContext";
import { getValidHex, getVariantLabel, isDefaultVariant } from "../../../shared/components/ProductVariantSelector";
import { VariantPickerDialog, toCartPayload } from "../../../features/cart/VariantPickerDialog";
import { formatPrice } from "../../../lib/formatPrice";
import "../../../styles/cartpage.css";

// ═══════════════════════════════════════════════════════════════════
// EMPTY CART ILLUSTRATION — empty embroidery hoop
// ═══════════════════════════════════════════════════════════════════

export function EmptyHoopIllustration({ size = 200 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size * 1.22}
      viewBox="0 0 200 244"
      fill="none"
      aria-hidden
    >
      {/* Soft ambient fill */}
      <ellipse
        cx="100"
        cy="132"
        rx="84"
        ry="72"
        fill="var(--accent-pink)"
        fillOpacity="0.08"
      />

      {/* ── Outer wooden hoop ring ── */}
      <circle
        cx="100"
        cy="132"
        r="74"
        stroke="var(--foreground-muted)"
        strokeWidth="10"
        fill="none"
        strokeOpacity="0.28"
        strokeLinecap="round"
      />

      {/* Slight grain/warmth on the wood */}
      <circle
        cx="100"
        cy="132"
        r="74"
        stroke="var(--accent-yellow)"
        strokeWidth="3"
        fill="none"
        strokeOpacity="0.25"
      />

      {/* ── Inner tightening ring ── */}
      <circle
        cx="100"
        cy="132"
        r="65"
        stroke="var(--foreground-muted)"
        strokeWidth="1.6"
        fill="none"
        strokeOpacity="0.22"
        strokeDasharray="4 5"
      />

      {/* ── Screw clasp at top of hoop ── */}
      <rect x="82" y="50" width="36" height="13" rx="6.5" fill="var(--foreground-muted)" fillOpacity="0.32" />
      <rect x="91" y="39" width="18" height="13" rx="4" fill="var(--foreground-muted)" fillOpacity="0.25" />
      <rect x="96" y="31" width="8" height="10" rx="2" fill="var(--foreground-muted)" fillOpacity="0.2" />
      <line x1="100" y1="31" x2="100" y2="37" stroke="var(--foreground-muted)" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.35" />

      {/* ── Empty fabric inside the hoop ── */}
      <circle cx="100" cy="132" r="60" fill="var(--background)" fillOpacity="0.55" />
      {[-30, -15, 0, 15, 30, 45].map((y) => (
        <line key={`h${y}`} x1="42" y1={132 + y} x2="158" y2={132 + y} stroke="var(--border)" strokeWidth="0.7" strokeOpacity="0.55" />
      ))}
      {[-30, -15, 0, 15, 30, 45].map((x) => (
        <line key={`v${x}`} x1={100 + x} y1="72" x2={100 + x} y2="192" stroke="var(--border)" strokeWidth="0.7" strokeOpacity="0.55" />
      ))}

      {/* ── A lone needle parked in the fabric ── */}
      <line x1="126" y1="88" x2="130" y2="168" stroke="var(--foreground-muted)" strokeWidth="2.2" strokeLinecap="round" strokeOpacity="0.35" />
      <ellipse cx="127" cy="90" rx="3.5" ry="2" stroke="var(--foreground-muted)" strokeWidth="1.2" fill="none" strokeOpacity="0.35" />
      <path d="M 127 90 C 122 81 124 74 120 68" stroke="var(--accent-pink)" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.55" />

      {/* ── Trailing unraveled thread from bottom of hoop ── */}
      <path d="M 100 196 C 96 208 106 214 100 224 C 94 232 104 236 100 244" stroke="var(--primary)" strokeWidth="1.7" strokeLinecap="round" fill="none" strokeDasharray="4.5 3" strokeOpacity="0.45" />
      <circle cx="100" cy="244" r="2.8" fill="var(--primary)" fillOpacity="0.35" />
      <circle cx="100" cy="244" r="1.4" fill="var(--primary)" fillOpacity="0.55" />

      {/* ── Small decorative motif: tiny yarn loop hovering in the empty fabric ── */}
      <g transform="translate(78, 122)" opacity="0.28">
        <path
          d="M11,0 C17,0 22,5 22,11 C22,17 17,22 11,22 C5,22 0,17 0,11 C0,5 5,0 11,0 Z
                 M11,6 C14,6 16,8 16,11 C16,14 14,16 11,16 C8,16 6,14 6,11 C6,8 8,6 11,6 Z"
          fill="var(--foreground-muted)"
          fillRule="evenodd"
        />
      </g>
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════
// EMPTY STATE — also used by Checkout
// ═══════════════════════════════════════════════════════════════════

export function EmptyCartState() {
  const { t } = useLanguage();

  return (
    <div className="cart-empty cart-fade-in">
      <div className="cart-empty-art">
        <EmptyHoopIllustration size={170} />
      </div>
      <h2 className="cart-empty-title">{t("cart.emptyTitle")}</h2>
      <p className="cart-empty-desc">{t("cart.emptyDesc")}</p>
      <div className="cart-empty-actions">
        <Link to="/shop" className="cart-btn is-primary">
          <ShoppingBag size={16} aria-hidden="true" />
          {t("cart.continueShopping")}
        </Link>
        <Link to="/love" className="cart-btn is-ghost">
          <Heart size={16} aria-hidden="true" />
          {t("cart.fromWishlist")}
        </Link>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PIECES
// ═══════════════════════════════════════════════════════════════════

function Thumb({ src, alt, seed, badge }: { src?: string; alt: string; seed: string; badge?: string }) {
  const fallback = `https://picsum.photos/seed/${seed}/160/160`;
  return (
    <div className="cart-thumb">
      <img
        src={src || fallback}
        alt={alt}
        loading="lazy"
        onError={(e) => {
          const img = e.currentTarget;
          if (!img.dataset.fallback) {
            img.dataset.fallback = "true";
            img.src = fallback;
          }
        }}
      />
      {badge && <span className="cart-thumb-badge">{badge}</span>}
    </div>
  );
}

function Stepper({
  value,
  max,
  label,
  onChange,
}: {
  value: number;
  max: number;
  label: string;
  onChange: (n: number) => void;
}) {
  return (
    <div className="cart-stepper" role="group" aria-label={`Số lượng ${label}`}>
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={value <= 1}
        aria-label="Giảm số lượng"
      >
        <Minus size={14} strokeWidth={2.4} />
      </button>
      <output aria-live="polite">{value}</output>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        aria-label="Tăng số lượng"
      >
        <Plus size={14} strokeWidth={2.4} />
      </button>
    </div>
  );
}

function RemoveButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="cart-remove" onClick={onClick} aria-label={`Xoá ${label} khỏi giỏ`}>
      <Trash2 size={16} />
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ROWS
// ═══════════════════════════════════════════════════════════════════

const LOW_STOCK = 5;
const MAX_QTY = 99;

function ProductRow({
  item,
  onQty,
  onRemove,
  onChangeVariant,
}: {
  item: CartItem;
  onQty: (n: number) => void;
  onRemove: () => void;
  /** Mở hộp đổi màu / phân loại. */
  onChangeVariant: () => void;
}) {
  const { t } = useLanguage();
  const hasColor = item.color && !isDefaultVariant({ color: item.color });
  const hex = hasColor ? getValidHex(item.hexCode) : undefined;
  const max = Math.min(item.stock || MAX_QTY, MAX_QTY);

  return (
    <li className="cart-row cart-fade-in">
      <Link to={`/shop/product/${item.productId}`} className="cart-row-media" tabIndex={-1} aria-hidden="true">
        <Thumb src={item.image} alt="" seed={item.productId} />
      </Link>

      <div className="cart-row-main">
        <div className="cart-row-head">
          <Link to={`/shop/product/${item.productId}`} className="cart-row-name">
            {item.name}
          </Link>
          <RemoveButton label={item.name} onClick={onRemove} />
        </div>

        <div className="cart-row-meta">
          {hasColor && (
            <button
              type="button"
              className="cart-chip is-button"
              onClick={onChangeVariant}
              aria-label={`Màu ${item.color} — đổi màu khác`}
              title="Đổi màu"
            >
              {hex && <span className="cart-swatch" style={{ background: hex }} aria-hidden="true" />}
              {item.color}
              <ChevronDown size={12} aria-hidden="true" />
            </button>
          )}
          {item.size && <span className="cart-chip">{item.size}</span>}
          <span className="cart-unit">{formatPrice(item.price)}</span>
        </div>

        {item.stock > 0 && item.stock <= LOW_STOCK && (
          <p className="cart-warn">{t("cart.lowStock", { count: item.stock })}</p>
        )}

        <div className="cart-row-foot">
          <Stepper value={item.quantity} max={max} label={item.name} onChange={onQty} />
          <span className="cart-line-total">{formatPrice(item.price * item.quantity)}</span>
        </div>
      </div>
    </li>
  );
}

function KitRow({
  kit,
  onQty,
  onRemove,
}: {
  kit: CartKitItem;
  onQty: (n: number) => void;
  onRemove: () => void;
}) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const listId = `kit-${kit.kitId}-items`;

  return (
    <li className="cart-row is-kit cart-fade-in">
      <Link to={`/kits/${kit.kitId}`} className="cart-row-media" tabIndex={-1} aria-hidden="true">
        <Thumb src={kit.thumbnail} alt="" seed={kit.kitId} badge={t("cart.bundle")} />
      </Link>

      <div className="cart-row-main">
        <div className="cart-row-head">
          <Link to={`/kits/${kit.kitId}`} className="cart-row-name">
            {kit.name}
          </Link>
          <RemoveButton label={kit.name} onClick={onRemove} />
        </div>

        <div className="cart-row-meta">
          <span className="cart-chip is-kit">
            <Package size={12} aria-hidden="true" />
            {t("cart.kitItems", { count: kit.products.length })}
          </span>
          <span className="cart-unit">{formatPrice(kit.price)}</span>
        </div>

        <button
          type="button"
          className="cart-kit-toggle"
          aria-expanded={open}
          aria-controls={listId}
          onClick={() => setOpen((v) => !v)}
        >
          <ChevronDown size={14} className={open ? "rotate-180" : ""} aria-hidden="true" />
          {open ? t("cart.hideItems", { count: kit.products.length }) : t("cart.showItems", { count: kit.products.length })}
        </button>

        {open && (
          <ul id={listId} className="cart-kit-list">
            {kit.products.map((p, i) => (
              <li key={`${p.productId}-${i}`}>
                <img src={p.image || `https://picsum.photos/seed/${p.productId}/60/60`} alt="" />
                <span>{p.name}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="cart-row-foot">
          <Stepper value={kit.quantity} max={MAX_QTY} label={kit.name} onChange={onQty} />
          <span className="cart-line-total">{formatPrice(kit.price * kit.quantity)}</span>
        </div>
      </div>
    </li>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SUMMARY
// ═══════════════════════════════════════════════════════════════════

function Summary({
  count,
  total,
  ctaRef,
}: {
  count: number;
  total: number;
  ctaRef: React.RefObject<HTMLAnchorElement>;
}) {
  const { t } = useLanguage();
  return (
    <section className="cart-summary" aria-labelledby="cart-summary-title">
      <h2 id="cart-summary-title" className="cart-summary-title">
        {t("cart.orderSummary")}
      </h2>
      <dl className="cart-summary-lines">
        <div>
          <dt>{t("cart.subtotal", { count })}</dt>
          <dd>{formatPrice(total)}</dd>
        </div>
        <div>
          <dt>{t("cart.shipping")}</dt>
          <dd className="is-muted">{t("cart.shippingAtCheckout")}</dd>
        </div>
      </dl>
      <div className="cart-summary-total">
        <span>{t("cart.orderTotal")}</span>
        <strong>{formatPrice(total)}</strong>
      </div>
      <Link ref={ctaRef} to="/order" className="cart-btn is-primary is-block">
        <Lock size={15} aria-hidden="true" />
        {t("cart.proceedToCheckout")}
        <ArrowRight size={15} aria-hidden="true" />
      </Link>
      <ul className="cart-assure">
        <li>
          <ShieldCheck size={14} aria-hidden="true" />
          {t("cart.securePayment")}
        </li>
        <li>
          <RotateCcw size={14} aria-hidden="true" />
          {t("cart.returns30Day")}
        </li>
      </ul>
    </section>
  );
}

/** Một bài DIY (mua chính bài DIY — title / mô tả / ảnh / giá của bài). */
function DIYRow({
  diy,
  onQty,
  onRemove,
}: {
  diy: CartDIYItem;
  onQty: (n: number) => void;
  onRemove: () => void;
}) {
  return (
    <li className="cart-row is-kit is-diy cart-fade-in">
      <Link to={`/diy/${diy.diyId}`} className="cart-row-media" tabIndex={-1} aria-hidden="true">
        <Thumb src={diy.image} alt="" seed={diy.diyId} badge="DIY" />
      </Link>

      <div className="cart-row-main">
        <div className="cart-row-head">
          <Link to={`/diy/${diy.diyId}`} className="cart-row-name">
            {diy.title}
          </Link>
          <RemoveButton label={diy.title} onClick={onRemove} />
        </div>

        <div className="cart-row-meta">
          <span className="cart-chip is-kit">
            <Sparkles size={12} aria-hidden="true" />
            DIY
          </span>
          <span className="cart-unit">{diy.price > 0 ? formatPrice(diy.price) : "Miễn phí"}</span>
        </div>

        {diy.description && <p className="cart-diy-desc">{diy.description}</p>}

        <div className="cart-row-foot">
          <Stepper value={diy.quantity} max={MAX_QTY} label={diy.title} onChange={onQty} />
          <span className="cart-line-total">{formatPrice(diy.price * diy.quantity)}</span>
        </div>
      </div>
    </li>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════════

export function CartPage() {
  const { t } = useLanguage();
  const {
    cartItems,
    cartKits,
    cartDIYs,
    addToCart,
    addKitToCart,
    addDIYToCart,
    removeDIYFromCart,
    updateDIYQuantity,
    removeFromCart,
    updateQuantity,
    changeVariant,
    updateKitQuantity,
    removeKitFromCart,
    clearCart,
    totalItems,
    totalPrice,
  } = useCart();
  // Dòng hàng đang đổi màu (null = hộp đóng).
  const [changing, setChanging] = useState<CartItem | null>(null);

  // Mobile: a checkout bar floats above the tab bar until the summary's own
  // button scrolls into view.
  const ctaRef = useRef<HTMLAnchorElement>(null);
  const [ctaVisible, setCtaVisible] = useState(false);
  const isEmpty = cartItems.length === 0 && cartKits.length === 0 && cartDIYs.length === 0;

  useEffect(() => {
    const el = ctaRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setCtaVisible(entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, [isEmpty]);

  const restoreItem = (item: CartItem) => {
    const { quantity, ...payload } = item;
    addToCart(payload, quantity);
  };
  const restoreKit = (kit: CartKitItem) => {
    addKitToCart({
      kitId: kit.kitId,
      name: kit.name,
      thumbnail: kit.thumbnail,
      price: kit.price,
      quantity: kit.quantity,
      products: kit.products,
    });
  };

  const restoreDIY = (diy: CartDIYItem) => {
    const { quantity, ...payload } = diy;
    addDIYToCart(payload, quantity);
  };
  const removeDIY = (diy: CartDIYItem) => {
    removeDIYFromCart(diy.diyId);
    toast(t("cart.removed", { name: diy.title }), {
      action: { label: t("cart.undo"), onClick: () => restoreDIY(diy) },
    });
  };

  const removeItem = (item: CartItem) => {
    removeFromCart(item.productId, item.variantId);
    toast(t("cart.removed", { name: item.name }), {
      action: { label: t("cart.undo"), onClick: () => restoreItem(item) },
    });
  };
  const removeKit = (kit: CartKitItem) => {
    removeKitFromCart(kit.kitId);
    toast(t("cart.removed", { name: kit.name }), {
      action: { label: t("cart.undo"), onClick: () => restoreKit(kit) },
    });
  };
  const clearAll = () => {
    const items = [...cartItems];
    const kits = [...cartKits];
    const diys = [...cartDIYs];
    clearCart();
    toast(t("cart.clearedAll"), {
      action: {
        label: t("cart.undo"),
        onClick: () => {
          items.forEach(restoreItem);
          kits.forEach(restoreKit);
          diys.forEach(restoreDIY);
        },
      },
    });
  };

  return (
    <div className="cart-page">
      <div className="cart-wrap">
        <header className="cart-header">
          <div>
            <p className="cart-eyebrow">{t("cart.eyebrow")}</p>
            <h1 className="cart-title">
              {t("cart.title")}
              {!isEmpty && <span className="cart-count">{totalItems}</span>}
            </h1>
          </div>
          {!isEmpty && (
            <button type="button" className="cart-clear" onClick={clearAll}>
              <Trash2 size={14} aria-hidden="true" />
              {t("cart.removeAll")}
            </button>
          )}
        </header>

        {isEmpty ? (
          <EmptyCartState />
        ) : (
          <div className="cart-layout">
            <div>
              <ul className="cart-list" aria-label={t("cart.title")}>
                {cartItems.map((item) => (
                  <ProductRow
                    key={`${item.productId}-${item.variantId}`}
                    item={item}
                    onQty={(n) => updateQuantity(item.productId, item.variantId, n)}
                    onRemove={() => removeItem(item)}
                    onChangeVariant={() => setChanging(item)}
                  />
                ))}
                {cartDIYs.map((diy) => (
                  <DIYRow
                    key={diy.diyId}
                    diy={diy}
                    onQty={(n) => updateDIYQuantity(diy.diyId, n)}
                    onRemove={() => removeDIY(diy)}
                  />
                ))}
                {cartKits.map((kit) => (
                  <KitRow
                    key={kit.kitId}
                    kit={kit}
                    onQty={(n) => updateKitQuantity(kit.kitId, n)}
                    onRemove={() => removeKit(kit)}
                  />
                ))}
              </ul>
              <Link to="/shop" className="cart-continue">
                <ArrowLeft size={15} aria-hidden="true" />
                {t("cart.continueShopping")}
              </Link>
            </div>

            <div className="cart-aside">
              <Summary count={totalItems} total={totalPrice} ctaRef={ctaRef} />
            </div>
          </div>
        )}
      </div>

      {!isEmpty && (
        <div className="cart-float" data-hidden={ctaVisible || undefined} aria-hidden={ctaVisible}>
          <div className="cart-float-total">
            <span>{t("cart.orderTotal")}</span>
            <strong>{formatPrice(totalPrice)}</strong>
          </div>
          <Link to="/order" className="cart-btn is-primary" tabIndex={ctaVisible ? -1 : undefined}>
            {t("cart.checkout")}
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
      )}
      {changing && (
        <VariantPickerDialog
          open={!!changing}
          onOpenChange={(open) => !open && setChanging(null)}
          productId={changing.productId}
          mode="change"
          initialVariantId={changing.variantId}
          onConfirm={(product, { variant }) => {
            const merging = cartItems.some(
              (it) => it.productId === changing.productId && it.variantId === variant.id,
            );
            changeVariant(changing.productId, changing.variantId, toCartPayload(product, variant));
            toast.success(`Đã đổi sang ${getVariantLabel(variant)}`, {
              description: merging
                ? "Màu này đã có trong giỏ nên số lượng được gộp lại."
                : changing.quantity > variant.stock
                  ? `Kho chỉ còn ${variant.stock} — số lượng đã được điều chỉnh.`
                  : undefined,
            });
          }}
        />
      )}
    </div>
  );
}
