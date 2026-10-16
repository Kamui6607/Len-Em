import { motion } from "motion/react";
import { HeroSection } from "../../shared/components/HeroSection";
import { HowItWorksSection } from "../../shared/components/HowItWorksSection";
import { LearnSection } from "../../shared/components/LearnSection";
import { ShopSection } from "../../shared/components/ShopSection";
import { DIYSection } from "../../shared/components/DIYSection";
import { ClosingCTA, LenEmFooter } from "../../shared/components/ClosingCTA";
import { Reveal } from "../../shared/components/motion/Reveal";
import { ScrollProgress } from "../../shared/components/motion/ScrollProgress";
import { SectionDivider } from "../../shared/components/motion/SectionDivider";

export function Home() {
  return (
    <>
      {/* NOTE: AnimatedBackground đã render GLOBAL trong AppRouter —
          render lại ở đây tạo 2 layer fixed blur chồng nhau (waste GPU mobile) */}
      <ScrollProgress />

      {/* Lớp "wash" rất nhẹ, phủ toàn trang — không phải một màu nền đặc mà
          chỉ là một lớp phủ mờ (~5%) giúp chữ/nội dung ở MỌI section giữ
          cùng một mức tương phản với AnimatedBackground phía sau, thay vì
          để từng section tự quyết định độ "che" khác nhau. Đây là cách
          "đồng nhất màu như Hero" cho toàn trang mà không cần mỗi section
          tự vẽ nền đặc riêng — Hero trước giờ vẫn ổn vì bản thân nó đã có
          lớp fiber-texture + glow riêng làm việc này cục bộ, giờ page-level
          wash lo phần đó chung cho tất cả. */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          background:
            "color-mix(in srgb, var(--background) 6%, transparent)",
        }}
      />

      {/* Page entrance fade — only on mount */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        style={{ position: "relative", zIndex: 1 }}
      >
        {/* ── Hero ── */}
        <div id="section-hero" style={{ scrollMarginTop: "0px" }}>
          <HeroSection stackMode="collapsed" />
        </div>

        {/* ── How It Works ── */}
        <div id="section-how-it-works" style={{ scrollMarginTop: "0px" }}>
          <SectionDivider accent="var(--accent-pink)" />
          <Reveal>
            <HowItWorksSection />
          </Reveal>
        </div>

        {/* ── Learn ── */}
        <div id="section-learn" style={{ scrollMarginTop: "0px" }}>
          <SectionDivider accent="var(--accent-yellow)" />
          <Reveal delay={0.05} y={36}>
            <LearnSection />
          </Reveal>
        </div>

        {/* ── Shop ── */}
        <div id="section-shop" style={{ scrollMarginTop: "0px" }}>
          <SectionDivider accent="var(--primary)" />
          <Reveal delay={0.05} y={40}>
            <ShopSection />
          </Reveal>
        </div>

        {/* ── DIY ── */}
        <div id="section-diy" style={{ scrollMarginTop: "0px" }}>
          <SectionDivider accent="var(--accent-pink)" />
          <Reveal delay={0.05} y={24}>
            <DIYSection />
          </Reveal>
        </div>

        {/* ── ClosingCTA: bg-primary (tím đậm) — điểm nhấn kết bài, cố tình khác nền ── */}
        <Reveal y={20}>
          <ClosingCTA />
        </Reveal>
        {/* ── LenEmFooter: bg-card ── */}
        <LenEmFooter />
      </motion.div>
    </>
  );
}