// ============================================================
// Cart Page — route /cart
// Uses CartContext for state management
// Design based on len-and-em-website CartPage
// ============================================================

import { useState } from "react";
import { Link } from "react-router";
import { X, ChevronDown, ChevronUp, Lock, ArrowRight, ShoppingBag, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "../../../context/CartContext";
import { formatPrice } from "../../../lib/formatPrice";
import { ImageWithFallback } from "../../../components/figma/ImageWithFallback";


// ═══════════════════════════════════════════════════════════════════
// EMPTY CART ILLUSTRATION — empty embroidery hoop
// ═══════════════════════════════════════════════════════════════════

export function EmptyHoopIllustration({ size = 200 }: { size?: number }) {
  return (
    <svg
      width={size} height={size * 1.22}
      viewBox="0 0 200 244"
      fill="none"
      aria-hidden
    >
      {/* Soft ambient fill */}
      <ellipse cx="100" cy="132" rx="84" ry="72"
        fill="var(--accent-pink)" fillOpacity="0.08" />

      {/* ── Outer wooden hoop ring ── */}
      <circle cx="100" cy="132" r="74"
        stroke="var(--foreground-muted)" strokeWidth="10"
        fill="none" strokeOpacity="0.28" strokeLinecap="round" />

      {/* Slight grain/warmth on the wood */}
      <circle cx="100" cy="132" r="74"
        stroke="var(--accent-yellow)" strokeWidth="3"
        fill="none" strokeOpacity="0.25" />

      {/* ── Inner tightening ring ── */}
      <circle cx="100" cy="132" r="65"
        stroke="var(--foreground-muted)" strokeWidth="1.6"
        fill="none" strokeOpacity="0.22"
        strokeDasharray="4 5" />

      {/* ── Screw clasp at top of hoop ── */}
      {/* Outer clasp body */}
      <rect x="82" y="50" width="36" height="13" rx="6.5"
        fill="var(--foreground-muted)" fillOpacity="0.32" />
      {/* Inner bolt shaft */}
      <rect x="91" y="39" width="18" height="13" rx="4"
        fill="var(--foreground-muted)" fillOpacity="0.25" />
      {/* Bolt head */}
      <rect x="96" y="31" width="8" height="10" rx="2"
        fill="var(--foreground-muted)" fillOpacity="0.2" />
      {/* Tightening slot */}
      <line x1="100" y1="31" x2="100" y2="37"
        stroke="var(--foreground-muted)" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.35" />

      {/* ── Empty fabric inside the hoop ── */}
      <circle cx="100" cy="132" r="60"
        fill="var(--background)" fillOpacity="0.55" />
      {/* Very subtle linen weave grid */}
      {[-30,-15,0,15,30,45].map(y => (
        <line key={`h${y}`}
          x1="42" y1={132+y} x2="158" y2={132+y}
          stroke="var(--border)" strokeWidth="0.7" strokeOpacity="0.55" />
      ))}
      {[-30,-15,0,15,30,45].map(x => (
        <line key={`v${x}`}
          x1={100+x} y1="72" x2={100+x} y2="192"
          stroke="var(--border)" strokeWidth="0.7" strokeOpacity="0.55" />
      ))}

      {/* ── A lone needle parked in the fabric ── */}
      <line x1="126" y1="88" x2="130" y2="168"
        stroke="var(--foreground-muted)" strokeWidth="2.2"
        strokeLinecap="round" strokeOpacity="0.35" />
      {/* Needle eye */}
      <ellipse cx="127" cy="90" rx="3.5" ry="2"
        stroke="var(--foreground-muted)" strokeWidth="1.2"
        fill="none" strokeOpacity="0.35" />
      {/* Thread through needle hanging loose */}
      <path d="M 127 90 C 122 81 124 74 120 68"
        stroke="var(--accent-pink)" strokeWidth="1.2"
        strokeLinecap="round" fill="none" opacity="0.55" />

      {/* ── Trailing unraveled thread from bottom of hoop ── */}
      <path
        d="M 100 196 C 96 208 106 214 100 224 C 94 232 104 236 100 244"
        stroke="var(--primary)" strokeWidth="1.7"
        strokeLinecap="round" fill="none"
        strokeDasharray="4.5 3" strokeOpacity="0.45"
      />
      {/* Thread end dot */}
      <circle cx="100" cy="244" r="2.8" fill="var(--primary)" fillOpacity="0.35" />
      <circle cx="100" cy="244" r="1.4" fill="var(--primary)" fillOpacity="0.55" />

      {/* ── Small decorative motif: tiny yarn loop hovering in the empty fabric ── */}
      <g transform="translate(78, 122)" opacity="0.28">
        <path d="M11,0 C17,0 22,5 22,11 C22,17 17,22 11,22 C5,22 0,17 0,11 C0,5 5,0 11,0 Z
                 M11,6 C14,6 16,8 16,11 C16,14 14,16 11,16 C8,16 6,14 6,11 C6,8 8,6 11,6 Z"
          fill="var(--foreground-muted)" fillRule="evenodd" />
      </g>
    </svg>
  );
}

export function EmptyCartState() {
  return (
    <div style={{
      display:"flex", flexDirection:"column" as const,
      alignItems:"center", justifyContent:"center",
      padding:"80px 32px",
      textAlign:"center" as const,
      minHeight:"420px",
    }}>
      <EmptyHoopIllustration size={180} />

      <h2 style={{
        fontFamily:"'Playfair Display',serif",
        fontSize:"1.4rem", fontWeight:600, fontStyle:"italic",
        color:"var(--foreground)", letterSpacing:"-0.015em",
        marginTop:"24px", marginBottom:"8px",
      }}>
        Your basket is still empty
      </h2>
      <p style={{
        fontFamily:"'Caveat',cursive",
        fontSize:"1rem", color:"var(--foreground-muted)",
        letterSpacing:"0.02em", marginBottom:"28px",
      }}>
        Every maker's journey starts with one skein.
      </p>

      <Link to="/shop" style={{
        display:"inline-flex", alignItems:"center", gap:"8px",
        padding:"11px 28px", borderRadius:"999px",
        border:"1.5px solid var(--primary)",
        background:"var(--background)",
        color:"var(--primary)",
        fontFamily:"'Inter',sans-serif",
        fontSize:"0.88rem", fontWeight:600,
        cursor:"pointer",
        boxShadow:"var(--shadow-sm)",
        textDecoration:"none",
      }}>
        <ShoppingBag size={14} strokeWidth={1.8} />
        Continue shopping
      </Link>
    </div>
  );
}

// ── Compact inline quantity stepper ──────────────────────────────

function InlineStepper({
  value, onChange, min = 1, max = 20,
}: {
  value: number; onChange: (n: number) => void; min?: number; max?: number;
}) {
  return (
    <div style={{
      display:"inline-flex", alignItems:"center",
      borderRadius:"999px",
      border:"1.5px solid var(--border)",
      background:"var(--background)",
      overflow:"hidden",
      height:"30px",
    }}>
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        style={{
          width:"28px", height:"30px",
          border:"none", background:"transparent",
          cursor:value <= min ? "not-allowed" : "pointer",
          display:"flex", alignItems:"center", justifyContent:"center",
          color:value <= min ? "var(--border)" : "var(--foreground-muted)",
        }}
      >
        <Minus size={11} strokeWidth={2.2} />
      </button>
      <span style={{
        minWidth:"22px", textAlign:"center" as const,
        fontFamily:"'Playfair Display',serif",
        fontSize:"0.85rem", fontWeight:600,
        color:"var(--foreground)", userSelect:"none" as const,
      }}>
        {value}
      </span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        style={{
          width:"28px", height:"30px",
          border:"none", background:"transparent",
          cursor:value >= max ? "not-allowed" : "pointer",
          display:"flex", alignItems:"center", justifyContent:"center",
          color:value >= max ? "var(--border)" : "var(--foreground-muted)",
        }}
      >
        <Plus size={11} strokeWidth={2.2} />
      </button>
    </div>
  );
}

// ── Product image cell ────────────────────────────────────────────

function ProductThumb({ img, dotColor, alt }: { img: string | null; dotColor?: string; alt: string }) {
  if (img) {
    return (
      <div style={{
        width:"80px", height:"80px", flexShrink:0,
        borderRadius:"14px", overflow:"hidden",
        border:"1px solid var(--border)",
        background:"var(--surface)",
      }}>
        <ImageWithFallback
          src={img} alt={alt}
          style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}
        />
      </div>
    );
  }
  return (
    <div style={{
      width:"80px", height:"80px", flexShrink:0,
      borderRadius:"14px",
      background: dotColor ?? "var(--surface)",
      border:"1px solid var(--border)",
      display:"flex", alignItems:"center", justifyContent:"center",
      boxShadow:"inset 0 1px 3px rgba(0,0,0,0.1)",
    }}>
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <circle cx="14" cy="14" r="11" fill="white" fillOpacity="0.25" stroke="white" strokeWidth="1.4" strokeOpacity="0.5"/>
        <circle cx="14" cy="14" r="5"  fill="white" fillOpacity="0.45"/>
      </svg>
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
    <div style={{
      display:"flex",
      alignItems:"center",
      gap:"16px",
      padding:"20px 0",
    }}>
      {/* Image */}
      <ProductThumb img={item.image} dotColor={item.hexCode} alt={item.name} />

      {/* Name + variant */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{
          fontFamily:"'Playfair Display',serif",
          fontSize:"1rem", fontWeight:600,
          color:"var(--foreground)", letterSpacing:"-0.01em",
          lineHeight:1.2, marginBottom:"5px",
        }}>
          {item.name}
        </div>
        {/* Variant chips */}
        <div style={{ display:"flex", alignItems:"center", gap:"7px", marginTop:"6px" }}>
          {/* Colour swatch */}
          <div style={{ display:"flex", alignItems:"center", gap:"4px" }}>
            <div style={{
              width:"12px", height:"12px", borderRadius:"50%",
              background:item.hexCode,
              border:"1px solid rgba(0,0,0,0.1)",
              boxShadow:"inset 0 1px 2px rgba(0,0,0,0.1)",
              flexShrink:0,
            }} />
            <span style={{
              fontFamily:"'Inter',sans-serif",
              fontSize:"0.68rem", color:"var(--foreground-muted)",
            }}>
              {item.color}
            </span>
          </div>
          {item.size && (
            <>
              <span style={{ color:"var(--border)", fontSize:"0.7rem" }}>·</span>
              {/* Size pill */}
              <span style={{
                padding:"1px 7px",
                borderRadius:"999px",
                border:"1px solid var(--border)",
                background:"var(--background)",
                fontFamily:"'Inter',sans-serif",
                fontSize:"0.65rem", color:"var(--foreground-muted)",
              }}>
                {item.size}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Stepper */}
      <InlineStepper
        value={item.quantity}
        onChange={(n) => onQtyChange(item.productId, item.variantId, n)}
      />

      {/* Price */}
      <div style={{
        fontFamily:"'Playfair Display',serif",
        fontSize:"1rem", fontWeight:700,
        color:"var(--foreground)", letterSpacing:"-0.015em",
        textAlign:"right" as const,
        minWidth:"58px", flexShrink:0,
      }}>
        {formatPrice(item.price * item.quantity)}
      </div>

      {/* Remove */}
      <button
        onClick={() => onRemove(item.productId, item.variantId)}
        style={{
          width:"28px", height:"28px",
          borderRadius:"50%",
          border:"1px solid var(--border)",
          background:"var(--background)",
          display:"flex", alignItems:"center", justifyContent:"center",
          cursor:"pointer",
          color:"var(--foreground-muted)",
          flexShrink:0,
          transition:"all 0.15s",
        }}
      >
        <X size={11} strokeWidth={2.5} />
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// CART KIT ROW
// ═══════════════════════════════════════════════════════════════════

const KIT_LEVEL_STYLE = {
  beginner: { bg:"var(--accent-pink)",   text:"var(--primary)" },
  pro:      { bg:"var(--badge-purple-bg)", text:"var(--badge-purple-text)" },
  promax:   { bg:"var(--accent-yellow)", text:"var(--warning-text)" },
};

interface CartKitRowProps {
  item: {
    kitId: string;
    name: string;
    level?: "beginner" | "pro" | "promax";
    price: number;
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
  onRemove: (kitId: string) => void;
  defaultExpanded?: boolean;
}

export function CartKitRow({
  item,
  onRemove,
  defaultExpanded = false,
}: CartKitRowProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const level = item.level || "beginner";
  const ls = KIT_LEVEL_STYLE[level];
  const saving = item.originalIndividualTotal ? item.originalIndividualTotal - item.price : 0;

  return (
    <div style={{
      background:"rgba(107,63,160,0.028)",
      borderRadius:"14px",
      border:"1px solid rgba(107,63,160,0.12)",
      overflow:"hidden",
    }}>
      {/* Main row */}
      <div style={{
        display:"flex", alignItems:"center", gap:"16px",
        padding:"18px 16px",
      }}>
        {/* Image + bundle badge overlay */}
        <div style={{ position:"relative" as const, flexShrink:0 }}>
          <ProductThumb img={item.thumbnail} alt={item.name} />
          {/* Bundle badge — bottom-left of image */}
          <div style={{
            position:"absolute" as const, bottom:"-4px", left:"-4px",
            padding:"2px 7px", borderRadius:"999px",
            background: ls.bg,
            border:"1.5px solid var(--background)",
            fontFamily:"'Caveat',cursive",
            fontSize:"0.58rem", fontWeight:700, color:ls.text,
            whiteSpace:"nowrap" as const,
            boxShadow:"var(--shadow-sm)",
          }}>
            Bundle
          </div>
        </div>

        {/* Name + meta */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"flex-start", gap:"8px", marginBottom:"4px", flexWrap:"wrap" as const }}>
            <div style={{
              fontFamily:"'Playfair Display',serif",
              fontSize:"1rem", fontWeight:600,
              color:"var(--foreground)", letterSpacing:"-0.01em", lineHeight:1.2,
            }}>
              {item.name}
            </div>
            {/* Level badge */}
            <span style={{
              padding:"2px 9px", borderRadius:"999px",
              background:ls.bg,
              fontFamily:"'Poppins','Inter',sans-serif",
              fontSize:"0.6rem", fontWeight:700,
              letterSpacing:"0.08em", textTransform:"uppercase" as const,
              color:ls.text,
              flexShrink:0,
            }}>
              {level}
            </span>
          </div>
          {/* Saving callout */}
          {saving > 0 && (
            <div style={{ display:"flex", alignItems:"center", gap:"6px", marginBottom:"6px" }}>
              <span style={{
                padding:"1px 7px", borderRadius:"999px",
                background:"var(--success-bg)",
                fontFamily:"'Inter',sans-serif",
                fontSize:"0.62rem", fontWeight:700, color:"var(--success-text)",
              }}>
                Bundle saves you {formatPrice(saving)}
              </span>
            </div>
          )}
          {/* Expand toggle */}
          <button
            onClick={() => setExpanded(e => !e)}
            style={{
              display:"inline-flex", alignItems:"center", gap:"4px",
              border:"none", background:"transparent",
              cursor:"pointer", padding:0,
              fontFamily:"'Caveat',cursive",
              fontSize:"0.72rem", color:"var(--primary)",
              letterSpacing:"0.02em",
            }}
          >
            {expanded
              ? <><ChevronUp   size={12} strokeWidth={2}/> Hide {item.products.length} items</>
              : <><ChevronDown size={12} strokeWidth={2}/> Show {item.products.length} items</>
            }
          </button>
        </div>

        {/* Price */}
        <div style={{
          fontFamily:"'Playfair Display',serif",
          fontSize:"1rem", fontWeight:700,
          color:"var(--foreground)", letterSpacing:"-0.015em",
          textAlign:"right" as const,
          minWidth:"58px", flexShrink:0,
        }}>
          {formatPrice(item.price)}
          {item.originalIndividualTotal && (
            <div style={{
              fontFamily:"'Inter',sans-serif",
              fontSize:"0.6rem", fontWeight:400,
              color:"var(--foreground-muted)",
              textDecoration:"line-through",
              textDecorationColor:"var(--accent-pink)",
            }}>
              {formatPrice(item.originalIndividualTotal)}
            </div>
          )}
        </div>

        {/* Remove */}
        <button
          onClick={() => onRemove(item.kitId)}
          style={{
            width:"28px", height:"28px", borderRadius:"50%",
            border:"1px solid var(--border)",
            background:"var(--background)",
            display:"flex", alignItems:"center", justifyContent:"center",
            cursor:"pointer", color:"var(--foreground-muted)", flexShrink:0,
          }}
        >
          <X size={11} strokeWidth={2.5} />
        </button>
      </div>

      {/* Expandable sub-items */}
      {expanded && (
        <div style={{
          borderTop:"1px solid rgba(107,63,160,0.12)",
          padding:"12px 16px 14px 112px",   // indented to align with name column
          background:"rgba(107,63,160,0.02)",
        }}>
          <div style={{ display:"flex", flexDirection:"column" as const, gap:"8px" }}>
            {item.products.map((sub, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                {/* Dot */}
                <div style={{
                  width:"10px", height:"10px", borderRadius:"50%",
                  background:sub.image || "#9B6FD6",
                  flexShrink:0,
                  border:"1px solid rgba(0,0,0,0.06)",
                  boxShadow:"inset 0 1px 2px rgba(0,0,0,0.1)",
                }} />
                {/* Name */}
                <span style={{
                  fontFamily:"'Inter',sans-serif",
                  fontSize:"0.78rem", fontWeight:500,
                  color:"var(--foreground)",
                }}>
                  {sub.name}
                </span>
                {/* Included chip */}
                <span style={{
                  marginLeft:"auto",
                  padding:"1px 7px", borderRadius:"999px",
                  background:"var(--background)",
                  border:"1px solid var(--border)",
                  fontFamily:"'Caveat',cursive",
                  fontSize:"0.6rem", color:"var(--foreground-muted)",
                }}>
                  included
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
// ORDER SUMMARY CARD
// ═══════════════════════════════════════════════════════════════════

export function OrderSummaryCard({
  cartItems,
  cartKits,
}: {
  cartItems: { price: number; quantity: number }[];
  cartKits: { price: number; originalIndividualTotal?: number }[];
}) {
  const [promoOpen, setPromoOpen] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoOk, setPromoOk] = useState(false);
  const [checking, setChecking] = useState(false);

  const subtotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0) + 
                   cartKits.reduce((s, k) => s + k.price, 0);
  const kitSavings = cartKits
    .reduce((s, k) => s + (k.originalIndividualTotal ? k.originalIndividualTotal - k.price : 0), 0);
  const promoSaving = promoOk ? Math.round(subtotal * 0.10) : 0;
  const shipping = subtotal >= 60000 ? 0 : 6950;
  const total = subtotal - promoSaving + shipping;

  const handleApplyPromo = () => {
    setChecking(true);
    setTimeout(() => { setChecking(false); setPromoOk(promoCode.toUpperCase() === "MAKER10"); }, 700);
  };

  return (
    <div style={{
      borderRadius:"20px",
      border:"1px solid var(--border)",
      background:"var(--surface)",
      overflow:"hidden",
      boxShadow:"var(--shadow-card)",
    }}>
      {/* Colour-stripe header */}
      <div style={{ height:"4px", background:"linear-gradient(90deg, var(--primary), var(--accent-pink), var(--accent-yellow))" }} />

      <div style={{ padding:"24px" }}>
        <h2 style={{
          fontFamily:"'Playfair Display',serif",
          fontSize:"1.05rem", fontWeight:600,
          color:"var(--foreground)", letterSpacing:"-0.015em",
          margin:"0 0 20px",
        }}>
          Order summary
        </h2>

        {/* Line items */}
        <div style={{ display:"flex", flexDirection:"column" as const, gap:"11px", marginBottom:"16px" }}>
          {/* Subtotal */}
          <div style={{ display:"flex", justifyContent:"space-between" }}>
            <span style={{ fontFamily:"'Inter',sans-serif", fontSize:"0.83rem", color:"var(--foreground-muted)" }}>
              Subtotal ({cartItems.reduce((s,i) => s + i.quantity, 0) + cartKits.length} items)
            </span>
            <span style={{ fontFamily:"'Playfair Display',serif", fontSize:"0.9rem", fontWeight:600, color:"var(--foreground)" }}>
              {formatPrice(subtotal)}
            </span>
          </div>

          {/* Kit savings */}
          {kitSavings > 0 && (
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ fontFamily:"'Caveat',cursive", fontSize:"0.8rem", color:"var(--success-text)" }}>
                ✦ Kit bundle savings
              </span>
              <span style={{ fontFamily:"'Playfair Display',serif", fontSize:"0.85rem", fontWeight:600, color:"var(--success-text)" }}>
                − {formatPrice(kitSavings)} <span style={{ fontFamily:"'Inter',sans-serif", fontSize:"0.65rem", fontWeight:400 }}>saved</span>
              </span>
            </div>
          )}

          {/* Promo */}
          {promoOk && (
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ fontFamily:"'Caveat',cursive", fontSize:"0.8rem", color:"var(--success-text)" }}>
                ✦ MAKER10 (10% off)
              </span>
              <span style={{ fontFamily:"'Playfair Display',serif", fontSize:"0.85rem", fontWeight:600, color:"var(--success-text)" }}>
                − {formatPrice(promoSaving)}
              </span>
            </div>
          )}

          {/* Shipping */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontFamily:"'Inter',sans-serif", fontSize:"0.83rem", color:"var(--foreground-muted)" }}>
              Shipping
            </span>
            <span style={{
              fontFamily:"'Inter',sans-serif",
              fontSize:"0.82rem", fontWeight: shipping === 0 ? 600 : 400,
              color: shipping === 0 ? "var(--success-text)" : "var(--foreground-muted)",
            }}>
              {shipping === 0 ? "Free ✓" : formatPrice(shipping)}
            </span>
          </div>

          {shipping > 0 && (
            <div style={{
              padding:"8px 12px", borderRadius:"10px",
              background:"rgba(245,239,168,0.5)",
              border:"1px solid var(--accent-yellow)",
            }}>
              <span style={{
                fontFamily:"'Caveat',cursive",
                fontSize:"0.72rem", color:"var(--warning-text)",
              }}>
                Add {formatPrice(60000 - subtotal)} more for free shipping →
              </span>
            </div>
          )}

          {/* Promo code toggle */}
          <div>
            <button
              onClick={() => setPromoOpen(o => !o)}
              style={{
                border:"none", background:"transparent", padding:0,
                fontFamily:"'Caveat',cursive",
                fontSize:"0.75rem", color:"var(--primary)",
                cursor:"pointer", letterSpacing:"0.02em",
                display:"flex", alignItems:"center", gap:"4px",
              }}
            >
              {promoOpen ? <ChevronUp size={11}/> : <ChevronDown size={11}/>}
              {promoOk ? "Promo applied ✓" : "Have a promo code?"}
            </button>

            {promoOpen && !promoOk && (
              <div style={{ display:"flex", gap:"6px", marginTop:"8px" }}>
                <input
                  value={promoCode}
                  onChange={e => setPromoCode(e.target.value)}
                  placeholder="Enter code…"
                  style={{
                    flex:1,
                    padding:"7px 12px",
                    borderRadius:"999px",
                    border:"1.5px solid var(--border)",
                    background:"var(--background)",
                    fontFamily:"'Inter',sans-serif",
                    fontSize:"0.78rem", color:"var(--foreground)",
                    outline:"none",
                  }}
                />
                <button
                  onClick={handleApplyPromo}
                  style={{
                    padding:"7px 14px",
                    borderRadius:"999px",
                    border:"none",
                    background:"var(--primary)",
                    color:"var(--primary-foreground)",
                    fontFamily:"'Inter',sans-serif",
                    fontSize:"0.75rem", fontWeight:600,
                    cursor:"pointer",
                    opacity:checking ? 0.7 : 1,
                  }}
                >
                  {checking ? "…" : "Apply"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Divider with scissors */}
        <div style={{ position:"relative" as const, margin:"4px 0 16px" }}>
          <div style={{ height:"1.5px", background:"linear-gradient(90deg, var(--primary) 0%, var(--accent-pink) 50%, var(--accent-yellow) 100%)", opacity:0.4 }} />
        </div>

        {/* Total */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:"20px" }}>
          <div>
            <div style={{ fontFamily:"'Inter',sans-serif", fontSize:"0.72rem", fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase" as const, color:"var(--foreground-muted)" }}>
              Order total
            </div>
            {(kitSavings > 0 || promoOk) && (
              <div style={{ fontFamily:"'Caveat',cursive", fontSize:"0.72rem", color:"var(--success-text)", marginTop:"1px" }}>
                You're saving {formatPrice(kitSavings + promoSaving)} today
              </div>
            )}
          </div>
          <span style={{
            fontFamily:"'Playfair Display',serif",
            fontSize:"1.8rem", fontWeight:700,
            color:"var(--primary)", letterSpacing:"-0.03em",
          }}>
            {formatPrice(total)}
          </span>
        </div>

        {/* Checkout CTA */}
        <Link to="/order" style={{
          width:"100%",
          display:"flex", alignItems:"center", justifyContent:"center", gap:"9px",
          padding:"14px 24px",
          borderRadius:"999px",
          border:"none",
          background:"var(--primary)",
          color:"var(--primary-foreground)",
          fontFamily:"'Inter',sans-serif",
          fontSize:"0.95rem", fontWeight:700,
          cursor:"pointer",
          boxShadow:"0 6px 20px rgba(107,63,160,0.28)",
          marginBottom:"12px",
          textDecoration:"none",
        }}>
          <Lock size={14} strokeWidth={2} />
          Proceed to checkout
          <ArrowRight size={14} strokeWidth={2} />
        </Link>

        {/* Assurance strip */}
        <div style={{ display:"flex", justifyContent:"center", gap:"16px", flexWrap:"wrap" as const }}>
          {["Secure payment", "30-day returns", "Free over 60.000₫"].map(note => (
            <span key={note} style={{
              fontFamily:"'Caveat',cursive",
              fontSize:"0.66rem", color:"var(--foreground-muted)",
              display:"flex", alignItems:"center", gap:"3px",
            }}>
              <span style={{ color:"var(--primary)", fontSize:"0.62rem" }}>✦</span>
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
  const { cartItems, cartKits, removeFromCart, updateQuantity, removeKitFromCart, clearCart, totalItems } = useCart();

  const updateQty = (productId: string, variantId: string, qty: number) =>
    updateQuantity(productId, variantId, qty);

  const removeItem = (productId: string, variantId: string) =>
    removeFromCart(productId, variantId);

  const removeKit = (kitId: string) =>
    removeKitFromCart(kitId);

  const handleClearCart = () => {
    clearCart();
    toast.success("Đã xoá tất cả sản phẩm khỏi giỏ hàng");
  };

  const isEmpty = cartItems.length === 0 && cartKits.length === 0;

  return (
    <div style={{
      minHeight:"100vh",
      background:"var(--background)",
      position:"relative" as const,
    }}>
      {/* Ambient glows */}
      <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0 }}>
        <div style={{ position:"absolute", inset:0, backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='6' height='6'%3E%3Crect x='0' y='0' width='1' height='1' fill='%236B3FA0' fill-opacity='0.022'/%3E%3C/svg%3E")` }} />
      </div>

      <div style={{ position:"relative", zIndex:1 }}>
        <div style={{ maxWidth:"1200px", margin:"0 auto", padding:"48px 40px 88px" }}>

          {/* Page heading */}
          <div style={{ marginBottom:"40px" }}>
            <div style={{ display:"flex", alignItems:"baseline", gap:"14px", marginBottom:"6px" }}>
              <h1 style={{
                fontFamily:"'Playfair Display',Georgia,serif",
                fontSize:"clamp(1.8rem, 2.5vw, 2.4rem)",
                fontWeight:700, color:"var(--foreground)",
                letterSpacing:"-0.025em", lineHeight:1.1, margin:0,
              }}>
                Your bag
              </h1>
              {!isEmpty && (
                <span style={{
                  fontFamily:"'Caveat',cursive",
                  fontSize:"0.9rem", color:"var(--foreground-muted)",
                }}>
                  {totalItems} items
                </span>
              )}
            </div>
            <div style={{ width:"60px", height:"2px", borderRadius:"999px", background:"var(--primary)", opacity:0.35 }} />
          </div>

          {isEmpty ? (
            <EmptyCartState />
          ) : (
            <div style={{
              display:"grid",
              gridTemplateColumns:"1fr 360px",
              gap:"40px",
              alignItems:"start",
            }}>
              {/* LEFT: items */}
              <div>
                {/* Items container */}
                <div style={{
                  borderRadius:"18px",
                  border:"1px solid var(--border)",
                  background:"var(--background)",
                  overflow:"hidden",
                  boxShadow:"var(--shadow-sm)",
                  padding:"0 20px",
                }}>
                  {cartItems.map((item, i) => (
                    <div key={`${item.productId}-${item.variantId}`}>
                      {i > 0 && <div style={{ height:"1px", background:"var(--border)" }} />}
                      <CartProductRow
                        item={item}
                        onQtyChange={updateQty}
                        onRemove={removeItem}
                      />
                    </div>
                  ))}
                  
                  {/* Cart Kits */}
                  {cartKits.length > 0 && (
                    <>
                      {cartItems.length > 0 && <div style={{ height:"1px", background:"var(--border)" }} />}
                      <div style={{ padding:"20px 0" }}>
                        {cartKits.map((kit) => (
                          <CartKitRow
                            key={kit.kitId}
                            item={kit}
                            onRemove={removeKit}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Clear all button */}
                <div style={{ marginTop:"16px", textAlign:"right" as const }}>
                  <button
                    onClick={handleClearCart}
                    style={{
                      fontFamily:"'Inter',sans-serif",
                      fontSize:"0.75rem", color:"var(--destructive)",
                      background:"transparent",
                      border:"1px solid var(--destructive)",
                      borderRadius:"999px",
                      padding:"6px 14px",
                      cursor:"pointer",
                    }}
                  >
                    Remove all items
                  </button>
                </div>

                {/* Continue shopping link */}
                <div style={{ marginTop:"12px", textAlign:"right" as const }}>
                  <Link to="/shop" style={{
                    fontFamily:"'Caveat',cursive",
                    fontSize:"0.82rem", color:"var(--primary)",
                    textDecoration:"none",
                    display:"inline-flex", alignItems:"center", gap:"4px",
                  }}>
                    ← Continue shopping
                  </Link>
                </div>
              </div>

              {/* RIGHT: order summary */}
              <div style={{ position:"sticky" as const, top:"24px" }}>
                <OrderSummaryCard 
                  cartItems={cartItems} 
                  cartKits={cartKits} 
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}