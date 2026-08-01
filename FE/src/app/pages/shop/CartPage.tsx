// ============================================================
// Cart Page — route /cart
// Uses CartContext for state management
// Design based on len-and-em-website CartPage
// ============================================================

import { useState } from "react";
import { Link } from "react-router";
import {
  X,
  ChevronDown,
  ChevronUp,
  Lock,
  ArrowRight,
  ShoppingBag,
  Minus,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { useCart } from "../../../context/CartContext";
import { useLanguage } from "../../../context/LanguageContext";
import { formatPrice } from "../../../lib/formatPrice";
import "./CartPage.css";

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

export function EmptyCartState() {
  const { t } = useLanguage();

  return (
    <div
      className="cart-fade-in"
      style={{
        position: "relative" as const,
        display: "flex",
        flexDirection: "column" as const,
        alignItems: "center",
        justifyContent: "center",
        padding: "96px 32px",
        textAlign: "center" as const,
        minHeight: "460px",
      }}
    >
      {/* Soft ambient glow behind the hoop */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          width: "320px",
          height: "320px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(107,63,160,0.08), transparent 70%)",
          filter: "blur(4px)",
          zIndex: 0,
        }}
      />

      <div style={{ position: "relative", zIndex: 1 }}>
        <EmptyHoopIllustration size={190} />
      </div>

      <h2
        style={{
          position: "relative",
          zIndex: 1,
          fontFamily: "'Playfair Display',serif",
          fontSize: "1.55rem",
          fontWeight: 600,
          fontStyle: "italic",
          color: "var(--foreground)",
          letterSpacing: "-0.015em",
          marginTop: "28px",
          marginBottom: "10px",
        }}
      >
        {t("cart.emptyTitle")}
      </h2>
      <p
        style={{
          position: "relative",
          zIndex: 1,
          fontFamily: "'Caveat',cursive",
          fontSize: "1.15rem",
          color: "var(--foreground-muted)",
          letterSpacing: "0.02em",
          marginBottom: "30px",
          maxWidth: "320px",
        }}
      >
        {t("cart.emptyDesc")}
      </p>

      <Link
        to="/shop"
        className="cart-empty-btn"
        style={{
          position: "relative",
          zIndex: 1,
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: "12px 30px",
          borderRadius: "999px",
          border: "1.5px solid var(--primary)",
          background: "var(--background)",
          color: "var(--primary)",
          fontFamily: "'Inter',sans-serif",
          fontSize: "0.9rem",
          fontWeight: 600,
          cursor: "pointer",
          textDecoration: "none",
        }}
      >
        <ShoppingBag size={15} strokeWidth={1.8} />
        {t("cart.continueShopping")}
      </Link>
    </div>
  );
}

// ── Compact inline quantity stepper ──────────────────────────────

function InlineStepper({
  value,
  onChange,
  min = 1,
  max = 20,
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        borderRadius: "999px",
        border: "1.5px solid var(--border)",
        background: "var(--background)",
        overflow: "hidden",
        height: "34px",
        flexShrink: 0,
      }}
    >
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        className="cart-stepper-btn"
        style={{
          width: "32px",
          height: "34px",
          border: "none",
          background: "transparent",
          cursor: value <= min ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: value <= min ? "var(--border)" : "var(--foreground-muted)",
        }}
        disabled={value <= min}
      >
        <Minus size={12} strokeWidth={2.2} />
      </button>
      <span
        style={{
          minWidth: "26px",
          textAlign: "center" as const,
          fontFamily: "'Playfair Display',serif",
          fontSize: "0.92rem",
          fontWeight: 600,
          color: "var(--foreground)",
          userSelect: "none" as const,
        }}
      >
        {value}
      </span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        className="cart-stepper-btn"
        style={{
          width: "32px",
          height: "34px",
          border: "none",
          background: "transparent",
          cursor: value >= max ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: value >= max ? "var(--border)" : "var(--foreground-muted)",
        }}
        disabled={value >= max}
      >
        <Plus size={12} strokeWidth={2.2} />
      </button>
    </div>
  );
}

// ── Product image cell, framed like a little embroidery hoop ────────

function ProductThumb({
  img,
  alt,
  fallbackSeed,
  size = 84,
}: {
  img: string | null;
  alt: string;
  fallbackSeed?: string;
  size?: number;
}) {
  const src = img || `https://picsum.photos/seed/${fallbackSeed || "product"}/100/100`;

  return (
    <div className="cart-thumb-ring" style={{ width: size, height: size }}>
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "16px",
          overflow: "hidden",
          border: "1px solid var(--border)",
          background: "var(--surface)",
        }}
      >
        <img
          src={src}
          alt={alt}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          onError={(e) => {
            const target = e.currentTarget;
            if (!target.dataset.fallback) {
              target.dataset.fallback = "true";
              target.src = `https://picsum.photos/seed/${fallbackSeed || "product"}/100/100`;
            }
          }}
        />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// CART PRODUCT ROW
// ═══════════════════════════════════════════════════════════════════

interface CartProductRowProps {
  item: {
    productId: string;
    variantId: string;
    name: string;
    image: string;
    color: string;
    hexCode: string;
    size?: string;
    price: number;
    quantity: number;
    stock: number;
  };
  onQtyChange: (productId: string, variantId: string, qty: number) => void;
  onRemove: (productId: string, variantId: string) => void;
}

export function CartProductRow({
  item,
  onQtyChange,
  onRemove,
}: CartProductRowProps) {
  return (
    <div
      className="cart-item-card cart-fade-in"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "18px",
        padding: "18px",
        borderRadius: "20px",
        border: "1px solid var(--border)",
        background: "var(--surface)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <ProductThumb img={item.image} alt={item.name} fallbackSeed={item.productId} />

      {/* Name + variant */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: "'Playfair Display',serif",
            fontSize: "1.05rem",
            fontWeight: 600,
            color: "var(--foreground)",
            letterSpacing: "-0.01em",
            lineHeight: 1.25,
            marginBottom: "6px",
          }}
        >
          {item.name}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" as const }}>
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <div
              style={{
                width: "13px",
                height: "13px",
                borderRadius: "50%",
                background: item.hexCode,
                border: "1px solid rgba(0,0,0,0.1)",
                boxShadow: "inset 0 1px 2px rgba(0,0,0,0.1)",
                flexShrink: 0,
              }}
            />
            <span style={{ fontFamily: "'Inter',sans-serif", fontSize: "0.72rem", color: "var(--foreground-muted)" }}>
              {item.color}
            </span>
          </div>
          {item.size && (
            <>
              <span style={{ color: "var(--border)", fontSize: "0.7rem" }}>·</span>
              <span
                style={{
                  padding: "2px 8px",
                  borderRadius: "999px",
                  border: "1px solid var(--border)",
                  background: "var(--background)",
                  fontFamily: "'Inter',sans-serif",
                  fontSize: "0.68rem",
                  color: "var(--foreground-muted)",
                }}
              >
                {item.size}
              </span>
            </>
          )}
        </div>
      </div>

      <InlineStepper value={item.quantity} onChange={(n) => onQtyChange(item.productId, item.variantId, n)} />

      <div
        style={{
          fontFamily: "'Playfair Display',serif",
          fontSize: "1.05rem",
          fontWeight: 700,
          color: "var(--foreground)",
          letterSpacing: "-0.015em",
          textAlign: "right" as const,
          minWidth: "64px",
          flexShrink: 0,
        }}
      >
        {formatPrice(item.price * item.quantity)}
      </div>

      <button
        onClick={() => onRemove(item.productId, item.variantId)}
        className="cart-remove-btn"
        aria-label="Remove"
        style={{
          width: "30px",
          height: "30px",
          borderRadius: "50%",
          border: "1px solid var(--border)",
          background: "var(--background)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: "var(--foreground-muted)",
          flexShrink: 0,
        }}
      >
        <X size={12} strokeWidth={2.5} />
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// CART KIT ROW
// ═══════════════════════════════════════════════════════════════════

const KIT_LEVEL_STYLE = {
  beginner: { bg: "var(--accent-pink)", text: "var(--primary)" },
  pro: { bg: "var(--badge-purple-bg)", text: "var(--badge-purple-text)" },
  promax: { bg: "var(--accent-yellow)", text: "var(--warning-text)" },
};

interface CartKitRowProps {
  item: {
    kitId: string;
    name: string;
    level?: "beginner" | "pro" | "promax";
    price: number;
    quantity: number;
    originalIndividualTotal?: number;
    thumbnail: string;
    productCount: number;
    products: {
      productId: string;
      variantId: string;
      name: string;
      image: string;
      price: number;
    }[];
  };
  onQtyChange: (kitId: string, quantity: number) => void;
  onRemove: (kitId: string) => void;
  defaultExpanded?: boolean;
}

export function CartKitRow({
  item,
  onQtyChange,
  onRemove,
  defaultExpanded = false,
}: CartKitRowProps) {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const level = item.level || "beginner";
  const ls = KIT_LEVEL_STYLE[level];
  const saving = item.originalIndividualTotal ? item.originalIndividualTotal - item.price : 0;

  return (
    <div
      className="cart-kit-card cart-fade-in"
      style={{
        background: "rgba(107,63,160,0.03)",
        borderRadius: "20px",
        border: "1.5px dashed rgba(107,63,160,0.28)",
        overflow: "hidden",
      }}
    >
      {/* Main row */}
      <div style={{ display: "flex", alignItems: "center", gap: "18px", padding: "18px" }}>
        <div style={{ position: "relative" as const, flexShrink: 0 }}>
          <ProductThumb img={item.thumbnail} alt={item.name} fallbackSeed={item.kitId} />
          <div
            style={{
              position: "absolute" as const,
              bottom: "-6px",
              left: "-6px",
              padding: "2px 8px",
              borderRadius: "999px",
              background: ls.bg,
              border: "1.5px solid var(--background)",
              fontFamily: "'Caveat',cursive",
              fontSize: "0.62rem",
              fontWeight: 700,
              color: ls.text,
              whiteSpace: "nowrap" as const,
              boxShadow: "var(--shadow-sm)",
            }}
          >
            Bundle
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginBottom: "5px", flexWrap: "wrap" as const }}>
            <div
              style={{
                fontFamily: "'Playfair Display',serif",
                fontSize: "1.05rem",
                fontWeight: 600,
                color: "var(--foreground)",
                letterSpacing: "-0.01em",
                lineHeight: 1.25,
              }}
            >
              {item.name}
            </div>
            <span
              style={{
                padding: "2px 10px",
                borderRadius: "999px",
                background: ls.bg,
                fontFamily: "'Poppins','Inter',sans-serif",
                fontSize: "0.6rem",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase" as const,
                color: ls.text,
                flexShrink: 0,
              }}
            >
              {level}
            </span>
          </div>

          {saving > 0 && (
            <div style={{ marginBottom: "7px" }}>
              <span
                style={{
                  padding: "2px 8px",
                  borderRadius: "999px",
                  background: "var(--success-bg)",
                  fontFamily: "'Inter',sans-serif",
                  fontSize: "0.64rem",
                  fontWeight: 700,
                  color: "var(--success-text)",
                }}
              >
                Bundle saves you {formatPrice(saving)}
              </span>
            </div>
          )}

          <button
            onClick={() => setExpanded((e) => !e)}
            className="cart-kit-expand-btn"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              padding: 0,
              fontFamily: "'Caveat',cursive",
              fontSize: "0.78rem",
              color: "var(--primary)",
              letterSpacing: "0.02em",
            }}
          >
            {expanded ? (
              <>
                <ChevronUp size={13} strokeWidth={2} /> {t("cart.hideItems", { count: item.products.length })}
              </>
            ) : (
              <>
                <ChevronDown size={13} strokeWidth={2} /> {t("cart.showItems", { count: item.products.length })}
              </>
            )}
          </button>
        </div>

        <InlineStepper value={item.quantity} onChange={(n) => onQtyChange(item.kitId, n)} />

        <div
          style={{
            fontFamily: "'Playfair Display',serif",
            fontSize: "1.05rem",
            fontWeight: 700,
            color: "var(--foreground)",
            letterSpacing: "-0.015em",
            textAlign: "right" as const,
            minWidth: "64px",
            flexShrink: 0,
          }}
        >
          {formatPrice(item.price * item.quantity)}
          {item.originalIndividualTotal && (
            <div
              style={{
                fontFamily: "'Inter',sans-serif",
                fontSize: "0.62rem",
                fontWeight: 400,
                color: "var(--foreground-muted)",
                textDecoration: "line-through",
                textDecorationColor: "var(--accent-pink)",
              }}
            >
              {t("cart.bundle")}
            </div>
          )}
        </div>

        <button
          onClick={() => onRemove(item.kitId)}
          className="cart-remove-btn"
          aria-label="Remove"
          style={{
            width: "30px",
            height: "30px",
            borderRadius: "50%",
            border: "1px solid var(--border)",
            background: "var(--background)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "var(--foreground-muted)",
            flexShrink: 0,
          }}
        >
          <X size={12} strokeWidth={2.5} />
        </button>
      </div>

      {/* Expandable sub-items */}
      {expanded && (
        <div
          className="cart-fade-in"
          style={{
            borderTop: "1.5px dashed rgba(107,63,160,0.28)",
            padding: "14px 18px 16px 116px",
            background: "rgba(107,63,160,0.025)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" as const, gap: "9px" }}>
            {item.products.map((sub, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    background: sub.image || "#9B6FD6",
                    flexShrink: 0,
                    border: "1px solid rgba(0,0,0,0.06)",
                    boxShadow: "inset 0 1px 2px rgba(0,0,0,0.1)",
                  }}
                />
                <span style={{ fontFamily: "'Inter',sans-serif", fontSize: "0.8rem", fontWeight: 500, color: "var(--foreground)" }}>
                  {sub.name}
                </span>
                <span
                  style={{
                    marginLeft: "auto",
                    padding: "2px 8px",
                    borderRadius: "999px",
                    background: "var(--background)",
                    border: "1px solid var(--border)",
                    fontFamily: "'Caveat',cursive",
                    fontSize: "0.65rem",
                    color: "var(--foreground-muted)",
                  }}
                >
                  {t("cart.included")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ORDER SUMMARY CARD — styled like a fabric-shop cutting ticket
// ═══════════════════════════════════════════════════════════════════

export function OrderSummaryCard({
  cartItems,
  cartKits,
}: {
  cartItems: { price: number; quantity: number }[];
  cartKits: { price: number; originalIndividualTotal?: number }[];
}) {
  const { t } = useLanguage();
  const [promoOpen, setPromoOpen] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoOk, setPromoOk] = useState(false);
  const [checking, setChecking] = useState(false);

  const subtotal =
    cartItems.reduce((s, i) => s + i.price * i.quantity, 0) +
    cartKits.reduce((s, k) => s + k.price, 0);
  const kitSavings = cartKits.reduce(
    (s, k) => s + (k.originalIndividualTotal ? k.originalIndividualTotal - k.price : 0),
    0,
  );
  const promoSaving = promoOk ? Math.round(subtotal * 0.1) : 0;
  const total = subtotal - promoSaving;

  const handleApplyPromo = () => {
    setChecking(true);
    setTimeout(() => {
      setChecking(false);
      setPromoOk(promoCode.toUpperCase() === "MAKER10");
    }, 700);
  };

  return (
    <div
      className="cart-ticket"
      style={{
        borderRadius: "24px",
        border: "1px solid var(--border)",
        background: "var(--surface)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      {/* Decorative thread loop — the page's one signature flourish */}
      <svg className="cart-ticket-tag" width="32" height="32" viewBox="0 0 34 34" fill="none" aria-hidden>
        <circle cx="17" cy="9" r="5" stroke="var(--primary)" strokeWidth="2" opacity="0.35" />
        <path d="M17 14 C 17 20, 10 20, 10 27" stroke="var(--primary)" strokeWidth="1.6" strokeDasharray="3 3" opacity="0.3" fill="none" />
      </svg>

      <div style={{ padding: "34px 26px 26px" }}>
        <h2
          style={{
            fontFamily: "'Playfair Display',serif",
            fontSize: "1.1rem",
            fontWeight: 600,
            color: "var(--foreground)",
            letterSpacing: "-0.015em",
            margin: "0 0 22px",
          }}
        >
          {t("cart.orderSummary")}
        </h2>

        {/* Line items */}
        <div style={{ display: "flex", flexDirection: "column" as const, gap: "12px", marginBottom: "18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontFamily: "'Inter',sans-serif", fontSize: "0.85rem", color: "var(--foreground-muted)" }}>
              {t("cart.subtotal", { count: cartItems.reduce((s, i) => s + i.quantity, 0) + cartKits.length })}
            </span>
            <span style={{ fontFamily: "'Playfair Display',serif", fontSize: "0.92rem", fontWeight: 600, color: "var(--foreground)" }}>
              {formatPrice(subtotal)}
            </span>
          </div>

          {kitSavings > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: "'Caveat',cursive", fontSize: "0.85rem", color: "var(--success-text)" }}>
                {t("cart.kitSavings")}
              </span>
              <span style={{ fontFamily: "'Playfair Display',serif", fontSize: "0.87rem", fontWeight: 600, color: "var(--success-text)" }}>
                − {formatPrice(kitSavings)}{" "}
                <span style={{ fontFamily: "'Inter',sans-serif", fontSize: "0.65rem", fontWeight: 400 }}>{t("cart.saved")}</span>
              </span>
            </div>
          )}

          {promoOk && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: "'Caveat',cursive", fontSize: "0.85rem", color: "var(--success-text)" }}>
                ✦ MAKER10 (10% off)
              </span>
              <span style={{ fontFamily: "'Playfair Display',serif", fontSize: "0.87rem", fontWeight: 600, color: "var(--success-text)" }}>
                − {formatPrice(promoSaving)}
              </span>
            </div>
          )}

          {/* Promo code toggle */}
          <div>
            <button
              onClick={() => setPromoOpen((o) => !o)}
              className="cart-promo-toggle"
              style={{
                border: "none",
                background: "transparent",
                padding: 0,
                fontFamily: "'Caveat',cursive",
                fontSize: "0.8rem",
                color: "var(--primary)",
                cursor: "pointer",
                letterSpacing: "0.02em",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              {promoOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {promoOk ? t("cart.promoApplied") : t("cart.havePromo")}
            </button>

            {promoOpen && !promoOk && (
              <div style={{ display: "flex", gap: "7px", marginTop: "9px" }}>
                <input
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder={t("cart.enterCode")}
                  style={{
                    flex: 1,
                    padding: "9px 14px",
                    borderRadius: "999px",
                    border: "1.5px solid var(--border)",
                    background: "var(--background)",
                    fontFamily: "'Inter',sans-serif",
                    fontSize: "0.8rem",
                    color: "var(--foreground)",
                    outline: "none",
                  }}
                />
                <button
                  onClick={handleApplyPromo}
                  className="cart-promo-apply"
                  disabled={checking}
                  style={{
                    padding: "9px 16px",
                    borderRadius: "999px",
                    border: "none",
                    background: "var(--primary)",
                    color: "var(--primary-foreground)",
                    fontFamily: "'Inter',sans-serif",
                    fontSize: "0.77rem",
                    fontWeight: 600,
                    cursor: checking ? "default" : "pointer",
                    opacity: checking ? 0.7 : 1,
                  }}
                >
                  {checking ? "…" : t("cart.apply")}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Stitched divider */}
        <div
          style={{
            height: 0,
            margin: "6px 0 18px",
            borderTop: "1.5px dashed color-mix(in srgb, var(--primary) 35%, var(--border))",
          }}
        />

        {/* Total */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "22px" }}>
          <div>
            <div
              style={{
                fontFamily: "'Inter',sans-serif",
                fontSize: "0.72rem",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase" as const,
                color: "var(--foreground-muted)",
              }}
            >
              {t("cart.orderTotal")}
            </div>
            {(kitSavings > 0 || promoOk) && (
              <div style={{ fontFamily: "'Caveat',cursive", fontSize: "0.75rem", color: "var(--success-text)", marginTop: "2px" }}>
                {t("cart.savingToday", { amount: formatPrice(kitSavings + promoSaving) })}
              </div>
            )}
          </div>
          <span
            style={{
              fontFamily: "'Playfair Display',serif",
              fontSize: "1.95rem",
              fontWeight: 700,
              color: "var(--primary)",
              letterSpacing: "-0.03em",
            }}
          >
            {formatPrice(total)}
          </span>
        </div>

        {/* Checkout CTA */}
        <Link
          to="/order"
          className="cart-checkout-btn"
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "9px",
            padding: "15px 24px",
            borderRadius: "999px",
            border: "none",
            background: "var(--primary)",
            color: "var(--primary-foreground)",
            fontFamily: "'Inter',sans-serif",
            fontSize: "0.96rem",
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 6px 20px rgba(107,63,160,0.28)",
            marginBottom: "14px",
            textDecoration: "none",
          }}
        >
          <Lock size={14} strokeWidth={2} />
          {t("cart.proceedToCheckout")}
          <ArrowRight size={14} strokeWidth={2} />
        </Link>

        {/* Assurance strip */}
        <div style={{ display: "flex", justifyContent: "center", gap: "18px", flexWrap: "wrap" as const }}>
          {[t("cart.securePayment"), t("cart.returns30Day")].map((note) => (
            <span
              key={note}
              style={{
                fontFamily: "'Caveat',cursive",
                fontSize: "0.7rem",
                color: "var(--foreground-muted)",
                display: "flex",
                alignItems: "center",
                gap: "3px",
              }}
            >
              <span style={{ color: "var(--primary)", fontSize: "0.65rem" }}>✦</span>
              {note}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// FULL CART PAGE
// ═══════════════════════════════════════════════════════════════════

export function CartPage() {
  const { t } = useLanguage();
  const {
    cartItems,
    cartKits,
    removeFromCart,
    updateQuantity,
    updateKitQuantity,
    removeKitFromCart,
    clearCart,
    totalItems,
  } = useCart();

  const updateQty = (productId: string, variantId: string, qty: number) => updateQuantity(productId, variantId, qty);
  const updateKitQty = (kitId: string, qty: number) => updateKitQuantity(kitId, qty);
  const removeItem = (productId: string, variantId: string) => removeFromCart(productId, variantId);
  const removeKit = (kitId: string) => removeKitFromCart(kitId);

  const handleClearCart = () => {
    clearCart();
    toast.success(t("cart.removeAllItems"));
  };

  const isEmpty = cartItems.length === 0 && cartKits.length === 0;

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", position: "relative" as const }}>
      {/* Ambient texture + soft corner glows */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='6' height='6'%3E%3Crect x='0' y='0' width='1' height='1' fill='%235B3DF5' fill-opacity='0.022'/%3E%3C/svg%3E")`,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "-140px",
            right: "-120px",
            width: "420px",
            height: "420px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(232,181,196,0.18), transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-160px",
            left: "-140px",
            width: "460px",
            height: "460px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(240,200,120,0.12), transparent 70%)",
          }}
        />
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "56px 40px 100px" }}>
          {/* Page heading */}
          <div style={{ marginBottom: "44px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "14px", marginBottom: "10px" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "14px" }}>
                <h1
                  style={{
                    fontFamily: "'Playfair Display',Georgia,serif",
                    fontSize: "clamp(2rem, 3vw, 2.6rem)",
                    fontWeight: 700,
                    color: "var(--foreground)",
                    letterSpacing: "-0.025em",
                    lineHeight: 1.1,
                    margin: 0,
                  }}
                >
                  {t("cart.yourBag")}
                </h1>
                {!isEmpty && (
                  <span style={{ fontFamily: "'Caveat',cursive", fontSize: "1rem", color: "var(--foreground-muted)" }}>
                    {totalItems} {t("cart.items")}
                  </span>
                )}
              </div>
              {!isEmpty && (
                <button
                  onClick={handleClearCart}
                  className="cart-clear-btn"
                  style={{
                    fontFamily: "'Inter',sans-serif",
                    fontSize: "0.78rem",
                    color: "var(--destructive)",
                    background: "transparent",
                    border: "1px solid var(--destructive)",
                    borderRadius: "999px",
                    padding: "7px 16px",
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                >
                  {t("cart.removeAllItems")}
                </button>
              )}
            </div>
            <div className="cart-heading-stitch" />
          </div>

          {isEmpty ? (
            <EmptyCartState />
          ) : (
            <div className="cart-layout">
              {/* LEFT: items */}
              <div>
                <div style={{ display: "flex", flexDirection: "column" as const, gap: "14px" }}>
                  {cartItems.map((item) => (
                    <CartProductRow
                      key={`${item.productId}-${item.variantId}`}
                      item={item}
                      onQtyChange={updateQty}
                      onRemove={removeItem}
                    />
                  ))}

                  {cartKits.map((kit) => (
                    <CartKitRow key={kit.kitId} item={kit} onQtyChange={updateKitQty} onRemove={removeKit} />
                  ))}
                </div>

                {/* Continue shopping link */}
                <div style={{ marginTop: "18px", textAlign: "right" as const }}>
                  <Link
                    to="/shop"
                    className="cart-continue-link"
                    style={{
                      fontFamily: "'Caveat',cursive",
                      fontSize: "0.86rem",
                      color: "var(--primary)",
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    ← {t("cart.continueShopping")}
                  </Link>
                </div>
              </div>

              {/* RIGHT: order summary */}
              <div className="cart-summary-sticky">
                <OrderSummaryCard cartItems={cartItems} cartKits={cartKits} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}