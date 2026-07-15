import { motion } from "motion/react";
import { ProductCard } from "../app/components/ProductCard";
import { products } from "../app/data/products";

// Take first 4 products from the shop
const SHOP_PRODUCTS = products.slice(0, 4);

// ── Section heading ───────────────────────────────────────────────────────────

function ShopHeading() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5 }}
      style={{ maxWidth: "560px", marginBottom: "40px" }}
    >
      {/* Eyebrow */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "16px",
        }}
      >
        <div
          style={{
            width: "24px",
            height: "1.5px",
            background: "var(--primary)",
            borderRadius: "1px",
            opacity: 0.5,
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
          Lựa chọn cho nghề thủ công của bạn
        </span>
      </div>

      {/* Headline */}
        <h2
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "clamp(2rem, 2.8vw, 2.8rem)",
            fontWeight: 700,
            color: "var(--foreground)",
            letterSpacing: "-0.025em",
            lineHeight: 1.1,
            marginBottom: "14px",
          }}
        >
          Nguyên liệu phù hợp{" "}
          <span style={{ fontStyle: "italic", color: "var(--primary)" }}>
            với dự án của bạn,
          </span>
        </h2>

        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "0.92rem",
            color: "var(--foreground-muted)",
            lineHeight: 1.65,
          }}
        >
          Mỗi cuộn sợi, kim và công cụ được chọn lọc để kết hợp với các bài học của chúng tôi.
          Di chuột qua thẻ để xem chi tiết.
        </p>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SHOP SECTION
// ═══════════════════════════════════════════════════════════════════

export function ShopSection() {
  return (
    <section className="px-4 py-20 sm:px-8 sm:py-28">
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Heading */}
        <ShopHeading />

         {/* Product grid - exactly like /shop */}
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
          {SHOP_PRODUCTS.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}