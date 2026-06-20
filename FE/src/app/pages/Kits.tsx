import { Search } from "lucide-react";
import { products } from "../data/products";
import { ProductCard } from "../components/ProductCard";

export function Kits() {
  const kits = products.filter((p) => p.category === "kit");

  return (
    <div className="min-h-screen bg-background py-10 px-4 pb-[calc(env(safe-area-inset-bottom)+72px)] md:pb-0">
      <style>{`
        .kits-top {
          background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
          padding: 2rem 1rem 1.5rem;
          position: relative;
          overflow: hidden;
        }
        .kits-top::before {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.06'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }
        .kits-container {
          max-width: 1200px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }
        .kits-headline {
          font-size: clamp(1.4rem, 5vw, 2rem);
          font-weight: 700;
          color: #fff;
          margin-bottom: 0.25rem;
          letter-spacing: -0.02em;
        }
        .kits-subhead {
          color: rgba(255,255,255,0.75);
          font-size: 0.875rem;
          margin-bottom: 1rem;
          max-width: 36rem;
        }
        .kits-search-row {
          position: relative;
          max-width: 480px;
        }
        .kits-search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(255,255,255,0.45);
          pointer-events: none;
        }
        .kits-search-input {
          width: 100%;
          min-height: 44px;
          padding: 10px 12px 10px 40px;
          background: rgba(255,255,255,0.15);
          border: 1.5px solid rgba(255,255,255,0.2);
          border-radius: 100px;
          outline: none;
          font-family: inherit;
          font-size: 0.9rem;
          color: #fff;
          transition: all 0.25s;
          -webkit-appearance: none;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }
        .kits-search-input::placeholder { color: rgba(255,255,255,0.45); }
        .kits-search-input:focus {
          background: rgba(255,255,255,0.22);
          border-color: rgba(255,255,255,0.4);
        }
        .kits-panel {
          background: var(--card-bg, var(--card));
          border-radius: 14px;
          border: 1px solid var(--border);
          box-shadow: 0 8px 24px color-mix(in srgb, var(--foreground) 6%, transparent);
        }
        .kits-product-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.75rem;
        }
        @media (min-width: 480px) {
          .kits-product-grid { gap: 1rem; }
        }
        @media (min-width: 768px) {
          .kits-product-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (min-width: 960px) {
          .kits-product-grid { grid-template-columns: repeat(3, 1fr); }
        }
        .kits-action-button {
          min-height: 44px;
          padding: 0.75rem 2rem;
          border-radius: 100px;
          transition: all 0.2s;
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
        }
      `}</style>

      <div className="kits-top">
        <div className="kits-container">
          <h1 className="kits-headline">DIY Kits</h1>
          <p className="kits-subhead">
            Everything you need in one box. Just add your creativity (and maybe some
            lo-fi music).
          </p>
          <div className="kits-search-row">
            <Search size={16} className="kits-search-icon" />
            <input
              className="kits-search-input"
              placeholder="Search kits…"
              aria-label="Search kits"
            />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto py-12 px-4 pb-[calc(env(safe-area-inset-bottom)+72px)] md:pb-0">
        <div className="kits-panel p-8 mb-12">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: "color-mix(in srgb, var(--primary) 14%, transparent)" }}>
                <span className="text-2xl">📦</span>
              </div>
              <h4>Complete Kits</h4>
              <p className="text-sm text-muted-foreground mt-2">
                All materials, tools, and instructions included. No guessing what to buy.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: "color-mix(in srgb, var(--primary) 12%, transparent)" }}>
                <span className="text-2xl">🎥</span>
              </div>
              <h4>Video Guides</h4>
              <p className="text-sm text-muted-foreground mt-2">
                Step-by-step videos you can pause, rewind, and watch at your own pace.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: "color-mix(in srgb, var(--primary) 10%, transparent)" }}>
                <span className="text-2xl">💬</span>
              </div>
              <h4>Community Support</h4>
              <p className="text-sm text-muted-foreground mt-2">
                Join other kit makers in our community to share progress and get help.
              </p>
            </div>
          </div>
        </div>

        <div className="kits-product-grid">
          {kits.map((kit) => (
            <ProductCard key={kit.id} product={kit} />
          ))}
        </div>

        <div className="mt-16 bg-card rounded-2xl p-8 text-center border border-border">
          <h2 className="mb-4">Not Sure Which Kit to Choose?</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Take our 2-minute quiz to find the perfect project for your skill level and
            style. We'll match you with a kit you'll actually finish!
          </p>
          <button type="button" className="kits-action-button bg-primary text-primary-foreground hover:bg-primary/90">
            Take the Quiz
          </button>
        </div>
      </div>
    </div>
  );
}