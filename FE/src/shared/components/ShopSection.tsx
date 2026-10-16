import { ArrowRight } from "lucide-react";
import { Link } from "react-router";
import { ProductCard } from "./ProductCard";
import { products } from "../../app/data/products";
import { useLanguage } from "../contexts/LanguageContext";

// Take first 4 products from the shop
const SHOP_PRODUCTS = products.slice(0, 4);

// ── Section heading ───────────────────────────────────────────────────────────

function ShopHeading() {
  const { t } = useLanguage();
  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
      <div style={{ maxWidth: "560px" }}>
        {/* Eyebrow */}
        <div className="mb-2 flex items-center gap-2 sm:mb-4">
          <div
            style={{
              width: "24px",
              height: "1.5px",
              background: "var(--primary)",
              borderRadius: "1px",
              opacity: 0.5,
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontFamily: "'Caveat', cursive",
              fontSize: "0.88rem",
              fontWeight: 500,
              color: "var(--primary)",
              letterSpacing: "0.05em",
            }}
          >
            {t("shop.eyebrow")}
          </span>
        </div>

        {/* Headline */}
        <h2
          className="mb-2 sm:mb-3.5"
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "clamp(1.6rem, 2.8vw, 2.8rem)",
            fontWeight: 700,
            color: "var(--foreground)",
            letterSpacing: "-0.025em",
            lineHeight: 1.15,
          }}
        >
          {t("shop.headline")}{" "}
          <span style={{ fontStyle: "italic", color: "var(--primary)" }}>
            {t("shop.headlineItalic")}
          </span>
        </h2>

        <p
          className="text-[0.86rem] sm:text-[0.92rem]"
          style={{
            fontFamily: "'Inter', sans-serif",
            color: "var(--foreground-muted)",
            lineHeight: 1.6,
          }}
        >
          {t("shop.subtitle")}
        </p>
      </div>

      <Link
        to="/shop"
        className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-full px-4 py-2 text-sm font-semibold sm:self-auto"
        style={{
          fontFamily: "'Inter', sans-serif",
          color: "var(--primary)",
          border: "1.5px solid color-mix(in srgb, var(--primary) 30%, transparent)",
          background: "color-mix(in srgb, var(--primary) 6%, transparent)",
        }}
      >
        {t("common.viewAll")}
        <ArrowRight size={15} strokeWidth={2.25} />
      </Link>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SHOP SECTION
// ═══════════════════════════════════════════════════════════════════

export function ShopSection() {
  return (
    <section
      className="px-4 sm:px-8"
      style={{
        position: "relative",
        overflow: "hidden",
        paddingTop: "var(--section-py-md)",
        paddingBottom: "var(--section-py-md)",
      }}
    >
      {/* Ambient background — same recipe (2 glow blobs + fiber texture)
          used across How It Works / Learn / DIY, so every section on the
          page reads as one consistent visual system rather than each
          being decorated on its own */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div
          style={{
            position: "absolute",
            width: "320px",
            height: "240px",
            top: "10%",
            left: "8%",
            borderRadius: "50%",
            background: "radial-gradient(ellipse, var(--glow-primary) 0%, transparent 70%)",
            filter: "blur(50px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: "260px",
            height: "200px",
            bottom: "6%",
            right: "10%",
            borderRadius: "50%",
            background: "radial-gradient(ellipse, var(--glow-lavender) 0%, transparent 72%)",
            filter: "blur(46px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='6' height='6'%3E%3Crect x='0' y='0' width='1' height='1' fill='%235B3DF5' fill-opacity='0.026'/%3E%3Crect x='3' y='3' width='1' height='1' fill='%23E8DEFF' fill-opacity='0.021'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div style={{ position: "relative", zIndex: 1, maxWidth: "1200px", margin: "0 auto" }}>
        {/* Heading */}
        <ShopHeading />

        {/* Product grid — 2 columns on phones keeps the section short */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 items-start">
          {SHOP_PRODUCTS.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}